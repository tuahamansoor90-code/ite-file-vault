import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Database, FolderOpen, Upload, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/file-index/AppShell";
import { AnalyticsPanel } from "@/components/file-index/AnalyticsPanel";
import { EmployeeAnalyticsPanel } from "@/components/employees/EmployeeAnalyticsPanel";
import { AddFileDialog } from "@/components/file-index/AddFileDialog";
import { UploadZone } from "@/components/file-index/UploadZone";
import { useFileStore } from "@/lib/file-store";
import { useEmployeeStore } from "@/lib/employee-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — File Vault" },
      {
        name: "description",
        content:
          "Overview of your archive: issued files, overdue returns, and people currently holding files.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { records, hydrated } = useFileStore();
  const { employees, hydrated: empHydrated } = useEmployeeStore();

  if (!hydrated) return <div className="min-h-screen bg-surface" />;

  if (records.length === 0) {
    return (
      <AppShell>
        {empHydrated && employees.length > 0 ? <EmployeeAnalyticsPanel /> : null}
        <div className="mx-auto flex max-w-3xl flex-col items-center px-2 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
          >
            <Database className="h-7 w-7" />
          </motion.div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome to your File Vault
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Start by importing your Excel archive or adding files one by one. Then jump to the
            Files page to search and track them.
          </p>
          <div className="mt-8 w-full">
            <UploadZone mode="replace" />
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>or</span>
              <AddFileDialog />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnalyticsPanel />
      <EmployeeAnalyticsPanel />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/files"
          className="group flex items-center justify-between rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] transition-colors hover:border-primary/50 hover:bg-primary-soft/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Browse Files</p>
              <p className="text-xs text-muted-foreground">Search, locate and issue records</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        <Link
          to="/import-export"
          className="group flex items-center justify-between rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] transition-colors hover:border-primary/50 hover:bg-primary-soft/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Import / Export</p>
              <p className="text-xs text-muted-foreground">Upload Excel or download backup</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </div>
    </AppShell>
  );
}
