import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rowsToRecords, useFileStore } from "@/lib/file-store";
import { toast } from "sonner";

interface Props {
  mode?: "replace" | "merge";
  compact?: boolean;
}

export function UploadZone({ mode = "merge", compact = false }: Props) {
  const { replaceAll, upsertMany } = useFileStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      let records: ReturnType<typeof rowsToRecords> = [];
      for (const name of wb.SheetNames) {
        const sheet = wb.Sheets[name];
        // Read as 2D array so we can auto-detect the header row
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });
        const headerIdx = findHeaderRow(matrix);
        if (headerIdx < 0) continue;
        const headers = (matrix[headerIdx] as unknown[]).map((h) =>
          String(h ?? "").trim(),
        );
        const rows = matrix.slice(headerIdx + 1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            if (h) obj[h] = (row as unknown[])[i] ?? "";
          });
          return obj;
        });
        records = rowsToRecords(rows);
        if (records.length) break;
      }
      if (!records.length) {
        toast.error(
          "Koi valid rows nahi mili. Make sure columns include File Code, Document Title, etc.",
        );
        return;
      }
      if (mode === "replace") replaceAll(records);
      else upsertMany(records);
      toast.success(`Imported ${records.length} records.`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to parse the Excel file.");
    }
  }

  function findHeaderRow(matrix: unknown[][]): number {
    const KEYWORDS = [
      "file code",
      "document title",
      "title",
      "department",
      "cabinet",
      "location",
      "year",
      "issued to",
      "status",
    ];
    const maxScan = Math.min(matrix.length, 15);
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < maxScan; i++) {
      const row = matrix[i] || [];
      const score = row.reduce<number>((acc, cell) => {
        const v = String(cell ?? "").trim().toLowerCase();
        return acc + (KEYWORDS.some((k) => v === k || v.includes(k)) ? 1 : 0);
      }, 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return bestScore >= 2 ? best : -1;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
        dragging
          ? "border-primary bg-primary-soft scale-[1.01]"
          : "border-border bg-surface hover:border-primary/50 hover:bg-primary-soft/40"
      } ${compact ? "p-4" : "p-10"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div className={`flex items-center gap-4 ${compact ? "" : "flex-col text-center"}`}>
        <motion.div
          animate={dragging ? { y: -4 } : { y: 0 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
        >
          {dragging ? <Upload className="h-6 w-6" /> : <FileSpreadsheet className="h-6 w-6" />}
        </motion.div>
        <div className={compact ? "flex-1" : ""}>
          <p className="font-semibold text-foreground">
            {compact ? "Import more records" : "Drop your Excel file here"}
          </p>
          <p className="text-sm text-muted-foreground">
            .xlsx, .xls, or .csv — columns map automatically
          </p>
        </div>
        {compact && (
          <Button size="sm" variant="secondary" type="button">
            Browse
          </Button>
        )}
      </div>
    </motion.div>
  );
}