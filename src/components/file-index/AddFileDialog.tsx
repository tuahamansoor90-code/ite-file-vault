import { useMemo, useState, useEffect, useRef } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFileStore, type FileRecord, type FileStatus, newId, DEPARTMENTS } from "@/lib/file-store";
import { toast } from "sonner";
import { handleEnterFocusNext } from "@/lib/focus-next";

const STATUSES: FileStatus[] = ["Available", "Issued", "Lost", "Archived", "Record Room"];
const CABINETS = Array.from({ length: 14 }, (_, i) => String(i + 1));
const ROWS = ["TOP", "A", "B", "C"] as const;
const SIDES = ["L", "R"] as const;

const empty = {
  fileCode: "",
  documentTitle: "",
  department: "",
  cabinetNumber: "",
  row: "",
  side: "",
  fullLocationCode: "",
  year: "",
  currentStatus: "Available" as FileStatus,
  issuedTo: "",
};

function computeLocation(cabinet: string, row: string, side: string): string {
  if (!cabinet || !row) return "";
  const cab = String(parseInt(cabinet, 10) || cabinet);
  if (row === "TOP") return `${cab}-TOP`;
  if (!side) return `${cab}-${row}`;
  return `${cab}-${row}-${side}`;
}

function nextFileCode(codes: string[]): string {
  const re = /^(.*?)(\d+)\s*$/;
  let bestPrefix = "FC-";
  let bestPad = 3;
  let bestMax = 0;
  const counts: Record<string, { max: number; pad: number; count: number }> = {};
  for (const c of codes) {
    const m = c.trim().match(re);
    if (!m) continue;
    const [, prefix, num] = m;
    const n = parseInt(num, 10);
    const entry = counts[prefix] ?? { max: 0, pad: num.length, count: 0 };
    entry.max = Math.max(entry.max, n);
    entry.pad = Math.max(entry.pad, num.length);
    entry.count += 1;
    counts[prefix] = entry;
  }
  let bestCount = 0;
  for (const [prefix, entry] of Object.entries(counts)) {
    if (entry.count > bestCount) {
      bestCount = entry.count;
      bestPrefix = prefix;
      bestPad = entry.pad;
      bestMax = entry.max;
    }
  }
  return `${bestPrefix}${String(bestMax + 1).padStart(bestPad, "0")}`;
}

export function AddFileDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { records, replaceAll } = useFileStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [autoCode, setAutoCode] = useState(true);
  const [autoLocation, setAutoLocation] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const suggestedCode = useMemo(
    () => nextFileCode(records.map((r) => r.fileCode).filter(Boolean)),
    [records],
  );

  useEffect(() => {
    if (open && autoCode) setForm((f) => ({ ...f, fileCode: suggestedCode }));
  }, [open, autoCode, suggestedCode]);

  useEffect(() => {
    if (!autoLocation) return;
    setForm((f) => {
      const loc = computeLocation(f.cabinetNumber, f.row, f.side);
      return f.fullLocationCode === loc ? f : { ...f, fullLocationCode: loc };
    });
  }, [autoLocation, form.cabinetNumber, form.row, form.side]);

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "row" && value === "TOP") next.side = "";
      return next;
    });
  }

  async function submit() {
    if (savingRef.current) return;
    if (!form.fileCode.trim() && !form.documentTitle.trim()) {
      toast.error("Enter at least File Code or Document Title");
      return;
    }
    if (
      form.fileCode.trim() &&
      records.some((r) => r.fileCode.toLowerCase() === form.fileCode.trim().toLowerCase())
    ) {
      toast.error("A file with this code already exists");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    const rec: FileRecord = {
      id: newId(),
      ...form,
      fileCode: form.fileCode.trim(),
      documentTitle: form.documentTitle.trim(),
      history: [],
    };
    try {
      await replaceAll([rec, ...records]);
      toast.success(`File added (${rec.fileCode || "no code"})`);
      setForm(empty);
      setAutoCode(true);
      setAutoLocation(true);
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("This File Code already exists, so it was not added again");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleCodeChange(value: string) {
    setAutoCode(false);
    set("fileCode", value);
  }

  const autoLocValue = computeLocation(form.cabinetNumber, form.row, form.side);
  const sideDisabled = form.row === "TOP" || !form.row;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a new file</DialogTitle>
          <DialogDescription>
            Manually insert a record into the index. All fields except File Code &amp; Title are
            optional.
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2"
          onKeyDownCapture={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              const t = e.target as HTMLElement;
              const submitOnEnter =
                t.closest("[data-submit-on-enter]") ||
                (t.closest("[data-submit-when-top]") && form.row === "TOP");
              if (submitOnEnter && t.getAttribute("aria-expanded") !== "true") {
                e.preventDefault();
                e.stopPropagation();
                void submit();
                return;
              }
            }
            handleEnterFocusNext(e);
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">File Code</Label>
              {autoCode ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> Auto-generated
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAutoCode(true);
                    set("fileCode", suggestedCode);
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Use auto ({suggestedCode})
                </button>
              )}
            </div>
            <Input
              value={form.fileCode}
              placeholder="e.g. FC-096"
              onChange={(e) => handleCodeChange(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">Document Title</Label>
            <Input
              value={form.documentTitle}
              placeholder="e.g. Land Lease Agreement"
              onChange={(e) => set("documentTitle", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Department</Label>
            <Select value={form.department} onValueChange={(v) => set("department", v)}>
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Year</Label>
            <Input
              value={form.year}
              placeholder="e.g. 2024"
              onChange={(e) => set("year", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Cabinet Number</Label>
            <Select value={form.cabinetNumber} onValueChange={(v) => set("cabinetNumber", v)}>
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Row</Label>
            <Select value={form.row} onValueChange={(v) => set("row", v)}>
              <SelectTrigger data-submit-when-top>
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Side {form.row === "TOP" && <span className="text-[10px]">(N/A for TOP)</span>}
            </Label>
            <Select value={form.side} onValueChange={(v) => set("side", v)} disabled={sideDisabled}>
              <SelectTrigger data-submit-on-enter>
                <SelectValue placeholder={sideDisabled ? "—" : "Select side"} />
              </SelectTrigger>
              <SelectContent>
                {SIDES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Current Status</Label>
            <Select
              value={form.currentStatus}
              onValueChange={(v) => set("currentStatus", v as FileStatus)}
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
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                Full Location Code
              </Label>
              {autoLocation ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> Auto
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAutoLocation(true);
                    set("fullLocationCode", autoLocValue);
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Use auto ({autoLocValue || "—"})
                </button>
              )}
            </div>
            <Input
              value={form.fullLocationCode}
              placeholder="e.g. 1-A-L"
              onChange={(e) => {
                setAutoLocation(false);
                set("fullLocationCode", e.target.value);
              }}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Issued To (optional)
            </Label>
            <Input value={form.issuedTo} onChange={(e) => set("issuedTo", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Add File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
