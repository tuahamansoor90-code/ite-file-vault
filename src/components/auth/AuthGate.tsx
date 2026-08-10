import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Lock, KeyRound, LogOut, Shield, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.png";

const STORAGE_KEY = "itx-vault-auth";
const PASSWORD_KEY = "itx-vault-password";
const DEFAULT_PASSWORD = "admin123";

function getStoredPassword(): string {
  if (typeof window === "undefined") return DEFAULT_PASSWORD;
  return window.localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_PASSWORD;
}

export function logout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
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

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setAuthed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-screen bg-background" aria-hidden />;
  if (authed) return <>{children}</>;

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (password === getStoredPassword()) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
      toast.success("Welcome back");
    } else {
      toast.error("Incorrect password");
      setPassword("");
    }
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (password !== getStoredPassword()) {
      toast.error("Current password is incorrect");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    window.localStorage.setItem(PASSWORD_KEY, newPassword);
    window.localStorage.setItem(STORAGE_KEY, "1");
    setAuthed(true);
    toast.success("Password updated");
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
                    className="w-full rounded-lg border border-input bg-background/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background"
                  />
                </div>

                <button
                  type="submit"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
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
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-[10px] text-muted-foreground/70">
                      Default:
                    </span>
                    <code className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      admin123
                    </code>
                  </div>
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
                    placeholder="New password (min 4 chars)"
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
