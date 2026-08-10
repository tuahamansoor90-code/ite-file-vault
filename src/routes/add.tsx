import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Check } from "lucide-react";
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
import { useFileStore, type FileRecord, newId, DEPARTMENTS } from "@/lib/file-store";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add file — File Vault" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
  }),
  component: AddPage,
});

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

function AddPage() {
  const { records, replaceAll, hydrated } = useFileStore();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const savingRef = useRef(false);

  const suggestedCode = useMemo(
    () => nextFileCode(records.map((r) => r.fileCode).filter(Boolean)),
    [records],
  );

  useEffect(() => {
    if (hydrated && !form.fileCode) {
      setForm((f) => ({ ...f, fileCode: suggestedCode }));
    }
  }, [hydrated, suggestedCode, form.fileCode]);

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "cabinetNumber" || key === "row" || key === "side") {
        const c = key === "cabinetNumber" ? value : next.cabinetNumber;
        const r = key === "row" ? value : next.row;
        const s = key === "side" ? value : next.side;
        next.fullLocationCode = computeLocation(c, r, r === "TOP" ? "" : s);
      }
      return next;
    });
  }

  async function saveRecord(source: typeof empty) {
    if (savingRef.current) return;
    const documentTitle = source.documentTitle.trim();
    const fileCode = (source.fileCode || suggestedCode).trim();
    if (!documentTitle && !fileCode) {
      toast.error("File Code ya Document Title likhein");
      return;
    }
    savingRef.current = true;
    setSaving(true);

    const rec: FileRecord = {
      id: newId(),
      fileCode,
      documentTitle,
      department: source.department.trim(),
      cabinetNumber: source.cabinetNumber,
      row: source.row,
      side: source.side,
      fullLocationCode:
        source.fullLocationCode ||
        computeLocation(source.cabinetNumber, source.row, source.side),
      year: source.year.trim(),
      currentStatus: "Available",
      issuedTo: "",
      history: [],
    };
    try {
      await replaceAll([rec, ...records]);
      setLastSaved(rec.fileCode || rec.documentTitle);
      toast.success(`Saved: ${rec.fileCode || rec.documentTitle}`);
      setForm({ ...empty, fileCode: "" });
      setTimeout(() => {
        setForm((f) => ({
          ...f,
          fileCode: nextFileCode([rec.fileCode, ...records.map((r) => r.fileCode)].filter(Boolean)),
        }));
      }, 50);
    } catch (e) {
      console.error(e);
      toast.error("Save failed — File Code duplicate hai");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function submit() {
    return saveRecord(form);
  }

  const sideDisabled = form.row === "TOP" || !form.row;

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/files"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Files
          </Link>
          <h1 className="text-base font-semibold">Add file</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {lastSaved && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">
            <Check className="h-4 w-4" /> Saved: <strong>{lastSaved}</strong>
          </div>
        )}

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">File Code</Label>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                  Auto
                </span>
              </div>
              <Input
                value={form.fileCode}
                placeholder={suggestedCode}
                onChange={(e) => set("fileCode", e.target.value)}
                className="h-12 font-mono text-base"
                inputMode="text"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Document Title *</Label>
              <Input
                value={form.documentTitle}
                placeholder="e.g. Land Lease Agreement"
                onChange={(e) => set("documentTitle", e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Department</Label>
                <Select value={form.department} onValueChange={(v) => set("department", v)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="—" />
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
                  placeholder="2024"
                  inputMode="numeric"
                  onChange={(e) => set("year", e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Cabinet</Label>
                <Select value={form.cabinetNumber} onValueChange={(v) => set("cabinetNumber", v)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="—" />
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
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="—" />
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
                <Label className="text-xs font-medium text-muted-foreground">Side</Label>
                <Select
                  value={form.side}
                  onValueChange={(v) => set("side", v)}
                  disabled={sideDisabled}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="—" />
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
            </div>

            {form.fullLocationCode && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-center text-sm font-mono text-foreground">
                {form.fullLocationCode}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {records.length} files total · {hydrated ? "ready" : "loading…"}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button
            onClick={() => void submit()}
            disabled={saving}
            className="h-14 w-full text-base"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving…
              </>
            ) : (
              "Save file"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
