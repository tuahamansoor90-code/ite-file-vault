import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, FolderOpen, Building2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/file-index/AppShell";
import { AddFileDialog } from "@/components/file-index/AddFileDialog";
import { FileDetail } from "@/components/file-index/FileDetail";
import { StatusBadge } from "@/components/file-index/StatusBadge";
import { useFileStore, type FileRecord, DEPARTMENTS } from "@/lib/file-store";

export const Route = createFileRoute("/files")({
  head: () => ({
    meta: [
      { title: "Files — File Vault" },
      { name: "description", content: "Search, locate, and manage every file in your archive." },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const { records, hydrated } = useFileStore();
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>(DEPARTMENTS);
    records.forEach((r) => {
      if (r.department?.trim()) {
        set.add(r.department.trim());
      }
    });
    return Array.from(set);
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (selectedDept !== "ALL") {
      const target = selectedDept.toLowerCase();
      list = list.filter((r) => r.department?.toLowerCase().trim() === target);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.fileCode, r.documentTitle, r.department, r.fullLocationCode, r.issuedTo, r.year]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) =>
      a.fileCode.localeCompare(b.fileCode, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [records, query, selectedDept]);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  if (!hydrated) return <div className="min-h-screen bg-surface" />;

  if (records.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-16 text-center">
          <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">No files yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to Import / Export to upload your Excel sheet, or add a file manually.
          </p>
          <div className="mt-6">
            <AddFileDialog />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Files</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {records.length} records shown
          </p>
        </div>
        <div className="flex gap-2">
          <AddFileDialog />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file code, title, department, location, or person…"
            className="h-12 rounded-xl pl-11 text-base shadow-[var(--shadow-soft)]"
          />
        </div>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="h-12 w-full rounded-xl sm:w-[260px] shadow-[var(--shadow-soft)]">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="ALL" className="font-medium text-primary">
              All Departments ({records.length})
            </SelectItem>
            {departmentOptions.map((dept) => {
              const count = records.filter((r) => r.department?.toLowerCase().trim() === dept.toLowerCase()).length;
              return (
                <SelectItem key={dept} value={dept}>
                  {dept} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
          <div className="hidden sm:grid grid-cols-[140px_1fr_140px_120px] gap-4 border-b bg-surface px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Code</span>
            <span>Document</span>
            <span>Location</span>
            <span>Status</span>
          </div>
          <ul className="max-h-[70vh] divide-y overflow-y-auto">
            <AnimatePresence initial={false}>
              {filtered.map((r) => (
                <RowItem
                  key={r.id}
                  record={r}
                  active={selectedId === r.id}
                  onSelect={() => setSelectedId(r.id)}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <li className="p-10 text-center text-sm text-muted-foreground">
                No matches for "{query}"
              </li>
            )}
          </ul>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <AnimatePresence mode="wait">
            {selected ? (
              <FileDetail
                key={selected.id}
                record={selected}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-center"
              >
                <Sparkles className="mb-3 h-8 w-8 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Select a file</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click any row to see full details, edit, or issue it to someone.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

function RowItem({
  record,
  active,
  onSelect,
}: {
  record: FileRecord;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onSelect}
      className={`flex cursor-pointer flex-col gap-1 px-4 py-3 transition-colors sm:grid sm:grid-cols-[140px_1fr_140px_120px] sm:items-center sm:gap-4 sm:px-5 sm:py-3.5 ${
        active ? "bg-primary-soft" : "hover:bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="truncate font-mono text-sm font-medium text-foreground">
          {record.fileCode || "—"}
        </span>
        <div className="sm:hidden">
          <StatusBadge status={record.currentStatus} />
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {record.documentTitle || "Untitled"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {record.department || "—"} · {record.year || "—"}
        </p>
      </div>
      <span className="truncate text-xs text-muted-foreground">
        {record.fullLocationCode || `${record.cabinetNumber}/${record.row}/${record.side}`}
      </span>
      <div className="hidden sm:block">
        <StatusBadge status={record.currentStatus} />
      </div>
    </motion.li>
  );
}
