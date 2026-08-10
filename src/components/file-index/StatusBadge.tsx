import type { FileStatus } from "@/lib/file-store";
import { CheckCircle2, UserCheck, AlertTriangle, Archive, Building2 } from "lucide-react";

const STYLES: Record<FileStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  Available: { cls: "bg-success-soft text-success", Icon: CheckCircle2 },
  Issued: { cls: "bg-warning-soft text-warning", Icon: UserCheck },
  Lost: { cls: "bg-destructive/10 text-destructive", Icon: AlertTriangle },
  Archived: { cls: "bg-muted text-muted-foreground", Icon: Archive },
  "Record Room": { cls: "bg-purple-500/10 text-purple-600 dark:text-purple-400", Icon: Building2 },
};

export function StatusBadge({ status }: { status: FileStatus }) {
  const { cls, Icon } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}