import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Lock, KeyRound, LogOut, Shield, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.png";

const STORAGE_KEY      = "itx-vault-auth";
const PASSWORD_KEY     = "itx-vault-password";
const FAILS_KEY        = "itx-vault-fails";
const LOCKOUT_KEY      = "itx-vault-lockout";
const SESSION_TS_KEY   = "itx-vault-session-ts";

const MAX_ATTEMPTS     = 3;
const LOCKOUT_MS       = 30_000;          // 30 seconds
const SESSION_DURATION = 8 * 60 * 60_000; // 8 hours

// ── Hashing ────────────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Default password hash for "admin123" — never store plain text
const DEFAULT_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

function getStoredHash(): string {
  if (typeof window === "undefined") return DEFAULT_HASH;
  const stored = window.localStorage.getItem(PASSWORD_KEY);
  if (!stored) return DEFAULT_HASH;
  return stored;
}

// ── Brute-force helpers ────────────────────────────────────────────────────────
function getFailedAttempts(): number {
  return parseInt(window.localStorage.getItem(FAILS_KEY) ?? "0", 10);
}

function getLockoutUntil(): number {
  return parseInt(window.localStorage.getItem(LOCKOUT_KEY) ?? "0", 10);
}

function recordFailedAttempt(): { locked: boolean; remaining: number } {
  const fails = getFailedAttempts() + 1;
  window.localStorage.setItem(FAILS_KEY, String(fails));
  if (fails >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_MS;
    window.localStorage.setItem(LOCKOUT_KEY, String(until));
    window.localStorage.setItem(FAILS_KEY, "0");
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - fails };
}

function clearFailedAttempts() {
  window.localStorage.removeItem(FAILS_KEY);
  window.localStorage.removeItem(LOCKOUT_KEY);
}

// ── Session helpers ────────────────────────────────────────────────────────────
function isSessionValid(): boolean {
  const authed = window.localStorage.getItem(STORAGE_KEY) === "1";
  if (!authed) return false;
  const ts = parseInt(window.localStorage.getItem(SESSION_TS_KEY) ?? "0", 10);
  if (Date.now() - ts > SESSION_DURATION) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_TS_KEY);
    return false;
  }
  return true;
}

function setSession() {
  window.localStorage.setItem(STORAGE_KEY, "1");
  window.localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
}

// ── Public exports ─────────────────────────────────────────────────────────────
export function logout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SESSION_TS_KEY);
    window.location.reload();
  }
}

export function LogoutButton() {
  return (
    <button
      onClick={logout}
      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      title="Sign out"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}

// ── AuthGate ───────────────────────────────────────────────────────────────────
export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady]               = useState(false);
  const [authed, setAuthed]             = useState(false);
  const [password, setPassword]         = useState("");
  const [changing, setChanging]         = useState(false);
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lockoutSecs, setLockoutSecs]   = useState(0);

  // Check session validity on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(isSessionValid());
    setReady(true);
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    const until = getLockoutUntil();
    if (until <= Date.now()) return;
    const remaining = Math.ceil((until - Date.now()) / 1000);
    setLockoutSecs(remaining);
    const interval = setInterval(() => {
      const secs = Math.ceil((getLockoutUntil() - Date.now()) / 1000);
      if (secs <= 0) {
        setLockoutSecs(0);
        clearInterval(interval);
      } else {
        setLockoutSecs(secs);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Session expiry watcher — check every minute while app is open
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        toast.error("Session expired. Please log in again.");
        setAuthed(false);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [authed]);

  if (!ready) return <div className="min-h-screen bg-background" aria-hidden />;
  if (authed) return <>{children}</>;

  const isLocked = lockoutSecs > 0;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const hash = await sha256(password);
    const stored = getStoredHash();
    
    // Check hash match OR legacy plain-text match
    if (hash === stored || password === stored) {
      // Auto-migrate legacy plain text stored password to hash
      if (stored.length !== 64) {
        window.localStorage.setItem(PASSWORD_KEY, hash);
      }
      clearFailedAttempts();
      setSession();
      setAuthed(true);
      toast.success("Welcome back");
    } else {
      const { locked, remaining } = recordFailedAttempt();
      setPassword("");
      if (locked) {
        setLockoutSecs(Math.ceil(LOCKOUT_MS / 1000));
        toast.error(`Too many failed attempts. Locked for ${LOCKOUT_MS / 1000} seconds.`);
      } else {
        toast.error(`Incorrect password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
      }
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    const currentHash = await sha256(password);
    const stored = getStoredHash();
    if (currentHash !== stored && password !== stored) {
      toast.error("Current password is incorrect");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const newHash = await sha256(newPassword);
    window.localStorage.setItem(PASSWORD_KEY, newHash);
    setSession();
    setAuthed(true);
    toast.success("Password updated successfully");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/8 blur-3xl animate-pulse" />
        <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-primary/6 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/20"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-24px) translateX(8px); opacity: 0.7; }
        }
      `}</style>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Top security accent bar */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
          <Shield className="h-4 w-4 text-primary/50" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
            Secure Access
          </span>
          <Shield className="h-4 w-4 text-primary/50" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-2xl shadow-primary/5 backdrop-blur-sm">
          {/* Header gradient stripe */}
          <div className="h-1.5 bg-gradient-to-r from-primary/40 via-primary to-accent/60" />

          <div className="px-8 pb-8 pt-6">
            {/* Logo area */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 -m-2 rounded-2xl bg-primary/5 blur-md" />
                <div className="relative flex h-20 w-auto items-center justify-center overflow-hidden rounded-xl border border-primary/15 bg-white px-4 py-2 shadow-lg shadow-primary/10">
                  <img
                    src={logoAsset}
                    alt="Innovative Tech Logo"
                    className="h-14 w-auto object-contain"
                  />
                </div>
                {/* Status dot */}
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-emerald-500 shadow-sm">
                  <Fingerprint className="h-2.5 w-2.5 text-white" />
                </div>
              </div>

              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {changing ? "Change Password" : "Innovative Tech Vault"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground/80">
                {changing
                  ? "Set a new password for this device"
                  : "Enter your password to continue"}
              </p>
            </div>

            {/* Lockout banner */}
            {isLocked && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <Shield className="h-4 w-4 shrink-0" />
                <span>Too many attempts. Try again in <strong>{lockoutSecs}s</strong>.</span>
              </div>
            )}

            {!changing ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={isLocked}
                    className="w-full rounded-lg border border-input bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLocked}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <KeyRound className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  Unlock Vault
                </button>

                <div className="flex flex-col items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setChanging(true);
                      setPassword("");
                    }}
                    className="text-xs text-muted-foreground/80 transition-colors hover:text-primary"
                  >
                    Change password
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full rounded-lg border border-input bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background"
                  />
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    className="w-full rounded-lg border border-input bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background"
                  />
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Shield className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-input bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background"
                  />
                </div>
                <button
                  type="submit"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Shield className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Update &amp; Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChanging(false);
                    setPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="w-full text-center text-xs text-muted-foreground/80 transition-colors hover:text-primary"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[10px] text-muted-foreground/40">
          Protected by Innovative Tech Solutions Pvt Ltd
        </p>
      </div>
    </div>
  );
}
