import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { Download, Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/file-index/AppShell";
import { UploadZone } from "@/components/file-index/UploadZone";
import { EmployeeImportExport } from "@/components/employees/EmployeeImportExport";
import { useFileStore } from "@/lib/file-store";
import { toast } from "sonner";

export const Route = createFileRoute("/import-export")({
  head: () => ({
    meta: [
      { title: "Import / Export — File Vault" },
      {
        name: "description",
        content: "Upload Excel files to populate your archive or export a backup as .xlsx.",
      },
    ],
  }),
  component: ImportExportPage,
});

function ImportExportPage() {
  const { records, hydrated } = useFileStore();

  if (!hydrated) return <div className="min-h-screen bg-surface" />;

  function exportXlsx() {
    if (records.length === 0) {
      toast.error("No records to export");
      return;
    }
    const rows = records.map((r) => ({
      "File Code": r.fileCode,
      "Document Title": r.documentTitle,
      Department: r.department,
      "Cabinet Number": r.cabinetNumber,
      Row: r.row,
      Side: r.side,
      "Full Location Code": r.fullLocationCode,
      Year: r.year,
      "Current Status": r.currentStatus,
      "Issued To": r.issuedTo,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Files");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `file-vault-${stamp}.xlsx`);
    toast.success(`Exported ${records.length} records`);
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Import &amp; Export</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring records in from Excel, or download a backup of everything in your vault.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Import from Excel</h3>
              <p className="text-xs text-muted-foreground">
                Merge new rows into your existing index
              </p>
            </div>
          </div>
          <UploadZone mode="merge" />

          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3">
            <p className="flex items-start gap-2 text-xs text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                <strong className="font-semibold">Replace all</strong> below will erase the
                current archive before importing.
              </span>
            </p>
            <div className="mt-3">
              <UploadZone mode="replace" compact />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Export to Excel</h3>
              <p className="text-xs text-muted-foreground">
                Download a .xlsx backup of every record
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-surface p-5">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-foreground">{records.length} records ready</p>
                <p className="text-xs text-muted-foreground">
                  Includes code, title, location, status &amp; holder
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={exportXlsx} disabled={records.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download .xlsx
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Tip: Export regularly so you always have a local backup of your archive.
          </p>
        </section>
      </div>

      <div className="mt-6">
        <EmployeeImportExport />
      </div>
    </AppShell>
  );
}
