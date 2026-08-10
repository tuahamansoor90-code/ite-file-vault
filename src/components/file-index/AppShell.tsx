import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FolderOpen, Upload, Users } from "lucide-react";
import { useFileStore } from "@/lib/file-store";
import { LogoutButton } from "@/components/auth/AuthGate";
import logoAsset from "@/assets/logo.png";
import type { ReactNode } from "react";

const navItems: { to: "/" | "/files" | "/employees" | "/import-export"; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/files", label: "Files", icon: FolderOpen },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/import-export", label: "Import / Export", icon: Upload },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { records, hydrated } = useFileStore();

  const stats = {
    total: records.length,
    issued: records.filter((r) => r.currentStatus === "Issued").length,
    available: records.filter((r) => r.currentStatus === "Available").length,
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-white px-2 shadow-[var(--shadow-soft)] ring-1 ring-border sm:h-12 sm:px-3">
                <img src={logoAsset} alt="Innovative Tech Engineering (Pvt) Ltd" className="h-7 w-auto object-contain sm:h-9" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base">
                  <span className="sm:hidden">ITE Vault</span>
                  <span className="hidden sm:inline">Innovative Tech Engineering</span>
                </h1>
                {hydrated ? (
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {stats.total} records · {stats.available} available · {stats.issued} issued
                  </p>
                ) : (
                  <p className="hidden text-xs text-muted-foreground sm:block">(Pvt) Ltd · File & Employee Vault</p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:order-3 sm:ml-2">
            <LogoutButton />
          </div>

          <nav className="order-3 -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-1 overflow-x-auto px-3 pb-1 sm:order-2 sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{
                  className:
                    "bg-primary-soft text-primary",
                }}
                inactiveProps={{
                  className: "text-muted-foreground hover:bg-surface hover:text-foreground",
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
