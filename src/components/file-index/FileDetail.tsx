import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import {
  MapPin,
  Building2,
  Calendar,
  Hash,
  FileText,
  History,
  Pencil,
  Save,
  X,
  UserCheck,
  Undo2,
  Trash2,
  FolderPlus,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "./StatusBadge";
import { useFileStore, type FileRecord, type FileStatus, newId, DEPARTMENTS } from "@/lib/file-store";
import { AddFileDialog } from "./AddFileDialog";
import { toast } from "sonner";

const STATUSES: FileStatus[] = ["Available", "Issued", "Lost", "Archived", "Record Room"];
const CABINETS = Array.from({ length: 14 }, (_, i) => String(i + 1));
const ROWS = ["TOP", "A", "B", "C"] as const;
const SIDES = ["L", "R"] as const;

function computeLocation(cabinet: string, row: string, side: string): string {
  if (!cabinet || !row) return "";
  const cab = String(parseInt(cabinet, 10) || cabinet);
  if (row === "TOP") return `${cab}-TOP`;
  if (!side) return `${cab}-${row}`;
  return `${cab}-${row}-${side}`;
}

export function FileDetail({ record, onClose }: { record: FileRecord; onClose: () => void }) {
  const { update, remove } = useFileStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FileRecord>(record);
  const [autoLocation, setAutoLocation] = useState(true);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ name: "", expected: "", time: "", note: "" });
  const [stickerOpen, setStickerOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (record) {
      QRCode.toDataURL(record.fileCode || record.id, { margin: 1, width: 120 })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [record]);

  function triggerPrintWindow() {
    const printWindow = window.open("", "_blank", "width=650,height=420");
    if (!printWindow) {
      toast.error("Could not open print popup");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sticker - ${record.fileCode}</title>
          <style>
            @page {
              size: landscape;
              margin: 0;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 16px;
              background: #ffffff;
              color: #000000;
            }
            .sticker-card {
              width: 100%;
              max-width: 500px;
              box-sizing: border-box;
              border: 3px solid #0f172a;
              border-radius: 12px;
              padding: 16px 20px;
              background: #ffffff;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .brand-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .brand-left {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .brand-logo {
              height: 28px;
              width: auto;
              object-fit: contain;
            }
            .brand-title {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              color: #0f172a;
            }
            .dept-badge {
              font-size: 10px;
              font-weight: 700;
              background: #f1f5f9;
              color: #0f172a;
              padding: 3px 8px;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              text-transform: uppercase;
            }
            .main-body {
              display: flex;
              gap: 16px;
              align-items: center;
            }
            .info-col {
              flex: 1;
              min-width: 0;
            }
            .file-code {
              font-family: 'Courier New', Courier, monospace;
              font-size: 26px;
              font-weight: 900;
              color: #0284c7;
              margin: 0 0 4px 0;
              line-height: 1;
              letter-spacing: 1px;
            }
            .file-title {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 10px 0;
              line-height: 1.3;
            }
            .location-box {
              display: inline-block;
              background: #0f172a;
              color: #ffffff;
              font-weight: 800;
              font-size: 14px;
              padding: 5px 12px;
              border-radius: 6px;
              letter-spacing: 1px;
            }
            .sub-meta {
              font-size: 11px;
              color: #64748b;
              margin-top: 8px;
              font-weight: 600;
            }
            .qr-col {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .qr-col img {
              width: 90px;
              height: 90px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div class="brand-header">
              <img src="/logo.jpg" style="height: 38px; width: auto; object-fit: contain;" alt="Innovative Tech Engineering (Pvt) Ltd" />
              <span class="dept-badge">${record.department || "General"}</span>
            </div>
            <div class="main-body">
              <div class="info-col">
                <div class="file-code">${record.fileCode || "NO-CODE"}</div>
                <div class="file-title">${record.documentTitle || "Untitled File"}</div>
                <div class="location-box">LOCATION: ${record.fullLocationCode || "N/A"}</div>
                <div class="sub-meta">YEAR: ${record.year || "N/A"}</div>
              </div>
              ${qrUrl ? `<div class="qr-col"><img src="${qrUrl}" alt="QR Code" /></div>` : ""}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function updateDraft(patch: Partial<FileRecord>) {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (patch.row === "TOP") next.side = "";
      if (autoLocation && ("cabinetNumber" in patch || "row" in patch || "side" in patch)) {
        next.fullLocationCode = computeLocation(next.cabinetNumber, next.row, next.side);
      }
      return next;
    });
  }

  function saveEdits() {
    update(record.id, draft);
    setEditing(false);
    toast.success("File updated");
  }

  function issueFile() {
    if (!issueForm.name.trim()) {
      toast.error("Enter a name");
      return;
    }
    let expectedReturn: string | undefined = undefined;
    if (issueForm.expected) {
      const time = issueForm.time || "00:00";
      expectedReturn = `${issueForm.expected}T${time}:00`;
    }
    const entry = {
      id: newId(),
      issuedTo: issueForm.name.trim(),
      issueDate: new Date().toISOString(),
      expectedReturn,
      note: issueForm.note || undefined,
    };
    update(record.id, {
      currentStatus: "Issued",
      issuedTo: entry.issuedTo,
      history: [entry, ...record.history],
    });
    setIssueOpen(false);
    setIssueForm({ name: "", expected: "", time: "", note: "" });
    toast.success(`Issued to ${entry.issuedTo}`);
  }

  function returnFile() {
    const [latest, ...rest] = record.history;
    const updatedHistory =
      latest && !latest.returnedDate
        ? [{ ...latest, returnedDate: new Date().toISOString() }, ...rest]
        : record.history;
    update(record.id, {
      currentStatus: "Available",
      issuedTo: "",
      history: updatedHistory,
    });
    toast.success("File marked as returned");
  }

  const fields: { label: string; key: keyof FileRecord; icon: typeof MapPin }[] = [
    { label: "File Code", key: "fileCode", icon: Hash },
    { label: "Document Title", key: "documentTitle", icon: FileText },
    { label: "Department", key: "department", icon: Building2 },
    { label: "Cabinet Number", key: "cabinetNumber", icon: MapPin },
    { label: "Row", key: "row", icon: MapPin },
    { label: "Side", key: "side", icon: MapPin },
    { label: "Full Location Code", key: "fullLocationCode", icon: MapPin },
    { label: "Year", key: "year", icon: Calendar },
  ];

  return (
    <motion.div
      key={record.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between gap-4 border-b p-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {record.fileCode || "—"}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-foreground">
            {record.documentTitle || "Untitled document"}
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={record.currentStatus} />
            {record.currentStatus === "Issued" && record.issuedTo && (
              <span className="text-sm text-muted-foreground">
                with <span className="font-medium text-foreground">{record.issuedTo}</span>
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, key, icon: Icon }) => {
            const isDepartment = key === "department";
            const isCabinet = key === "cabinetNumber";
            const isRow = key === "row";
            const isSide = key === "side";
            const isLocation = key === "fullLocationCode";
            return (
              <div key={key} className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {editing && isLocation && autoLocation && (
                    <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                      Auto
                    </span>
                  )}
                  {editing && isLocation && !autoLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setAutoLocation(true);
                        setDraft((d) => ({
                          ...d,
                          fullLocationCode: computeLocation(d.cabinetNumber, d.row, d.side),
                        }));
                      }}
                      className="ml-auto text-[11px] font-medium text-primary hover:underline"
                    >
                      Use auto
                    </button>
                  )}
                </Label>
                {editing && isDepartment ? (
                  <Select
                    value={draft.department}
                    onValueChange={(v) => updateDraft({ department: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : editing && isCabinet ? (
                  <Select
                    value={draft.cabinetNumber}
                    onValueChange={(v) => updateDraft({ cabinetNumber: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cabinet (1–14)" />
                    </SelectTrigger>
                    <SelectContent>
                      {CABINETS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : editing && isRow ? (
                  <Select value={draft.row} onValueChange={(v) => updateDraft({ row: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select row" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROWS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : editing && isSide ? (
                  <Select
                    value={draft.side}
                    onValueChange={(v) => updateDraft({ side: v })}
                    disabled={draft.row === "TOP" || !draft.row}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={draft.row === "TOP" || !draft.row ? "—" : "Select side"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {SIDES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : editing ? (
                  <Input
                    value={(draft[key] as string) ?? ""}
                    onChange={(e) => {
                      if (isLocation) setAutoLocation(false);
                      updateDraft({ [key]: e.target.value } as Partial<FileRecord>);
                    }}
                    className={isLocation ? "font-mono" : undefined}
                  />
                ) : (
                  <div className="rounded-lg border bg-surface px-3 py-2 text-sm text-foreground">
                    {(record[key] as string) || "—"}
                  </div>
                )}
              </div>
            );
          })}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Current Status</Label>
            {editing ? (
              <Select
                value={draft.currentStatus}
                onValueChange={(v) => setDraft({ ...draft, currentStatus: v as FileStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-lg border bg-surface px-3 py-2 text-sm">
                {record.currentStatus}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Issued To</Label>
            {editing ? (
              <Input
                value={draft.issuedTo}
                onChange={(e) => setDraft({ ...draft, issuedTo: e.target.value })}
              />
            ) : (
              <div className="rounded-lg border bg-surface px-3 py-2 text-sm">
                {record.issuedTo || "—"}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="h-4 w-4" />
            Issue History
          </h3>
          {(!record.history || record.history.length === 0) ? (
            <p className="rounded-lg border border-dashed bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
              No issue records yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {(record.history || []).map((h) => (
                <motion.li
                  key={h.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border bg-surface p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{h.issuedTo}</span>
                    <span
                      className={`text-xs ${h.returnedDate ? "text-success" : "text-warning"}`}
                    >
                      {h.returnedDate ? "Returned" : "Open"}
                    </span>
                  </div>
                  <div className="mt-1 grid gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Issued: {new Date(h.issueDate).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</span>
                    {h.expectedReturn && (
                      <span>Due: {new Date(h.expectedReturn).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</span>
                    )}
                    {h.returnedDate && (
                      <span>Returned: {new Date(h.returnedDate).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</span>
                    )}
                  </div>
                  {h.note && <p className="mt-2 text-xs text-muted-foreground">{h.note}</p>}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-surface/60 p-4">
        {editing ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(record);
                setAutoLocation(true);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEdits}>
              <Save className="mr-2 h-4 w-4" /> Save changes
            </Button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary-soft"
                onClick={() => setStickerOpen(true)}
              >
                <Printer className="mr-1.5 h-4 w-4" /> Print Sticker
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(record);
                  setAutoLocation(
                    !record.fullLocationCode ||
                      record.fullLocationCode ===
                        computeLocation(record.cabinetNumber, record.row, record.side),
                  );
                  setEditing(true);
                }}
              >
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this record?")) {
                    remove(record.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </div>
            {record.currentStatus === "Issued" ? (
              <Button onClick={returnFile}>
                <Undo2 className="mr-2 h-4 w-4" /> Mark as Returned
              </Button>
            ) : (
              <Button onClick={() => setIssueOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" /> Issue File
              </Button>
            )}
          </>
        )}
      </div>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue this file</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Issued To</Label>
              <Input
                placeholder="Person's name"
                value={issueForm.name}
                onChange={(e) => setIssueForm({ ...issueForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expected Return Date</Label>
                <Input
                  type="date"
                  value={issueForm.expected}
                  onChange={(e) => setIssueForm({ ...issueForm, expected: e.target.value })}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={issueForm.time}
                  onChange={(e) => setIssueForm({ ...issueForm, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input
                placeholder="Reason / reference"
                value={issueForm.note}
                onChange={(e) => setIssueForm({ ...issueForm, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={issueFile}>Confirm Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stickerOpen} onOpenChange={setStickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              File Sticker / Label Preview
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="relative overflow-hidden rounded-xl border-2 border-foreground/80 bg-card p-5 shadow-md">
              <div className="mb-3 flex items-center justify-between border-b border-foreground/30 pb-2">
                <img src="/logo.jpg" alt="Innovative Tech Engineering" className="h-9 w-auto object-contain" />
                <span className="rounded-md border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                  {record.department || "General"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="font-mono text-2xl font-black tracking-wide text-primary">
                    {record.fileCode || "NO-CODE"}
                  </div>
                  <div className="line-clamp-2 text-sm font-bold text-foreground">
                    {record.documentTitle || "Untitled File"}
                  </div>
                  <div className="inline-block rounded-md bg-foreground px-2.5 py-1 font-mono text-xs font-bold text-background tracking-wider">
                    LOCATION: {record.fullLocationCode || "N/A"}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Year: {record.year || "N/A"}
                  </div>
                </div>
                {qrUrl && (
                  <div className="shrink-0 rounded-lg border bg-white p-1 shadow-sm">
                    <img src={qrUrl} alt="QR Code" className="h-20 w-20" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setStickerOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                triggerPrintWindow();
                setStickerOpen(false);
              }}
            >
              <Printer className="mr-2 h-4 w-4" /> Print Sticker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}