import { useMemo } from "react";
import { motion } from "framer-motion";
import { Send, AlertTriangle, Clock, Users } from "lucide-react";
import { useFileStore, type FileRecord } from "@/lib/file-store";

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

interface Holder {
  name: string;
  files: { code: string; title: string; days: number; overdue: boolean }[];
}

export function AnalyticsPanel() {
  const { records } = useFileStore();

  const data = useMemo(() => {
    const today = new Date();
    let issuedToday = 0;
    let returnedToday = 0;
    let overdueCount = 0;
    const holdersMap = new Map<string, Holder>();

    for (const r of records) {
      for (const h of r.history) {
        if (isSameDay(h.issueDate, today)) issuedToday++;
        if (h.returnedDate && isSameDay(h.returnedDate, today)) returnedToday++;
      }
      if (r.currentStatus === "Issued" && r.issuedTo) {
        const open = r.history.find((h) => !h.returnedDate);
        const issueDate = open ? new Date(open.issueDate) : today;
        const days = Math.max(0, Math.floor((+today - +issueDate) / 86_400_000));
        const overdue = !!(open?.expectedReturn && new Date(open.expectedReturn) < today);
        if (overdue) overdueCount++;
        const entry = holdersMap.get(r.issuedTo) ?? { name: r.issuedTo, files: [] };
        entry.files.push({
          code: r.fileCode || "—",
          title: r.documentTitle || "Untitled",
          days,
          overdue,
        });
        holdersMap.set(r.issuedTo, entry);
      }
    }

    const lost = records.filter((r: FileRecord) => r.currentStatus === "Lost").length;
    const issued = records.filter((r: FileRecord) => r.currentStatus === "Issued").length;
    const holders = Array.from(holdersMap.values()).sort((a, b) => b.files.length - a.files.length);

    return { issuedToday, returnedToday, overdueCount, lost, issued, holders };
  }, [records]);

  const cards = [
    {
      label: "Issued today",
      value: data.issuedToday,
      icon: Send,
      tone: "text-primary bg-primary-soft",
      sub: `${data.returnedToday} returned`,
    },
    {
      label: "Currently out",
      value: data.issued,
      icon: Clock,
      tone: "text-warning bg-warning/10",
      sub: `${data.holders.length} ${data.holders.length === 1 ? "person" : "people"}`,
    },
    {
      label: "Overdue",
      value: data.overdueCount,
      icon: AlertTriangle,
      tone: "text-destructive bg-destructive/10",
      sub: "past expected return",
    },
    {
      label: "Lost",
      value: data.lost,
      icon: AlertTriangle,
      tone: "text-destructive bg-destructive/10",
      sub: "marked missing",
    },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Analytics</h2>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="border-t px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Files not yet returned</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {data.holders.length} {data.holders.length === 1 ? "holder" : "holders"}
          </span>
        </div>
        {data.holders.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
            Everything is back in the archive.
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {data.holders.map((h) => (
              <li
                key={h.name}
                className="flex items-start justify-between gap-3 rounded-lg border bg-surface p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {h.files
                      .map((f) => `${f.code}${f.overdue ? " (overdue)" : ""}`)
                      .join(", ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {h.files.length} {h.files.length === 1 ? "file" : "files"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
