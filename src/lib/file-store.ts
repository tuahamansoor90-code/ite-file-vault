import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FileStatus = "Available" | "Issued" | "Lost" | "Archived" | "Record Room";

export const DEPARTMENTS = [
  "HR & Payroll",
  "Accounts & Finance",
  "Taxation",
  "Store & Materials",
  "Quality Assurance",
  "R&D / Design & Development",
  "Technical / Drawings",
  "Casting Drawings (CS)",
  "CAM Department",
  "Gear & LSR",
  "Utilities & Maintenance",
  "Security",
  "IT & Systems",
  "Export & Commercial",
  "Foreign Vendor Correspondence",
  "Local Vendor Correspondence",
  "Unidentified Files",
];

export interface IssueRecord {
  id: string;
  issuedTo: string;
  issueDate: string;
  expectedReturn?: string;
  returnedDate?: string;
  note?: string;
}

export interface FileRecord {
  id: string;
  fileCode: string;
  documentTitle: string;
  department: string;
  cabinetNumber: string;
  row: string;
  side: string;
  fullLocationCode: string;
  year: string;
  currentStatus: FileStatus;
  issuedTo: string;
  history: IssueRecord[];
}

const OFFLINE_CACHE_KEY = "file_index_offline_cache_v2";

// Load local cache immediately at module load time for instant (<1ms) rendering
function loadLocalCache(): FileRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read local file cache", e);
  }
  return [];
}

function saveLocalCache(records: FileRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save local file cache", e);
  }
}

const initialCached = loadLocalCache();
let fileRecords: FileRecord[] = initialCached;
let fileHydrated = true; // Always instant hydrated
let fileLoadPromise: Promise<void> | null = null;
let fileRealtimeReady = false;
const fileSubscribers = new Set<() => void>();

function notifyFiles() {
  fileSubscribers.forEach((listener) => listener());
}

function setFileSnapshot(records: FileRecord[]) {
  fileRecords = records;
  fileHydrated = true;
  saveLocalCache(records);
  notifyFiles();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): FileRecord {
  const status = (r.current_status ?? "Available") as string;
  return {
    id: r.id,
    fileCode: r.file_code ?? "",
    documentTitle: r.document_title ?? "",
    department: r.department ?? "",
    cabinetNumber: r.cabinet_number ?? "",
    row: r.row ?? "",
    side: r.side ?? "",
    fullLocationCode: r.full_location_code ?? "",
    year: r.year ?? "",
    currentStatus: (["Available", "Issued", "Lost", "Archived"].includes(status)
      ? status
      : "Available") as FileStatus,
    issuedTo: r.issued_to ?? "",
    history: Array.isArray(r.history) ? (r.history as IssueRecord[]) : [],
  };
}

function toRow(r: Partial<FileRecord>) {
  const row: Record<string, unknown> = {};
  if (r.fileCode !== undefined) row.file_code = r.fileCode;
  if (r.documentTitle !== undefined) row.document_title = r.documentTitle;
  if (r.department !== undefined) row.department = r.department;
  if (r.cabinetNumber !== undefined) row.cabinet_number = r.cabinetNumber;
  if (r.row !== undefined) row.row = r.row;
  if (r.side !== undefined) row.side = r.side;
  if (r.fullLocationCode !== undefined) row.full_location_code = r.fullLocationCode;
  if (r.year !== undefined) row.year = r.year;
  if (r.currentStatus !== undefined) row.current_status = r.currentStatus;
  if (r.issuedTo !== undefined) row.issued_to = r.issuedTo;
  if (r.history !== undefined) row.history = r.history;
  return row;
}

function toInsertRow(r: FileRecord) {
  return {
    id: r.id,
    file_code: r.fileCode || "",
    document_title: r.documentTitle || "",
    department: r.department || "",
    cabinet_number: r.cabinetNumber || "",
    row: r.row || "",
    side: r.side || "",
    full_location_code: r.fullLocationCode || "",
    year: r.year || "",
    current_status: r.currentStatus || "Available",
    issued_to: r.issuedTo || "",
    history: r.history || [],
  };
}

export function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}



async function syncRemoteFiles() {
  if (fileLoadPromise) return fileLoadPromise;
  if (typeof window !== "undefined" && !navigator.onLine) {
    return Promise.resolve();
  }
  fileLoadPromise = (async () => {
    try {
      const BATCH_SIZE = 1000;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allRows: any[] = [];
      let page = 0;
      let hasMore = true;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 500)
      );

      const fetchTask = (async () => {
        while (hasMore) {
          const from = page * BATCH_SIZE;
          const to = from + BATCH_SIZE - 1;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any)
            .from("files")
            .select("*")
            .order("created_at", { ascending: false })
            .range(from, to);

          if (error || !data || data.length === 0) {
            hasMore = false;
          } else {
            allRows.push(...data);
            if (data.length < BATCH_SIZE) {
              hasMore = false;
            } else {
              page++;
            }
          }
        }
      })();

      await Promise.race([fetchTask, timeoutPromise]);

      if (allRows.length > 0) {
        setFileSnapshot(allRows.map(fromRow));
      }
    } catch {
      // Ignore network delays/errors, keep instant local cache
    } finally {
      fileLoadPromise = null;
    }
  })();
  return fileLoadPromise;
}

function ensureFilesRealtime() {
  if (fileRealtimeReady || typeof window === "undefined") return;
  fileRealtimeReady = true;
  try {
    supabase
      .channel("files-store-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "files" }, () => {
        void syncRemoteFiles();
      })
      .subscribe();
  } catch {
    /* ignore offline */
  }
}

export function useFileStore() {
  const [, forceRender] = useState(0);

  const load = useCallback(async () => {
    await syncRemoteFiles();
  }, []);

  useEffect(() => {
    const rerender = () => forceRender((tick) => tick + 1);
    fileSubscribers.add(rerender);
    ensureFilesRealtime();
    // Non-blocking background sync
    void syncRemoteFiles();
    return () => {
      fileSubscribers.delete(rerender);
    };
  }, []);

  return {
    records: fileRecords,
    hydrated: true,
    reload: load,
    replaceAll: async (next: FileRecord[]) => {
      const nextIds = new Set(next.map((r) => r.id));
      const current = fileRecords;
      const toDelete = current.filter((r) => !nextIds.has(r.id)).map((r) => r.id);
      const currentIds = new Set(current.map((r) => r.id));
      const toInsert = next.filter((r) => !currentIds.has(r.id));
      const toUpdate = next.filter((r) => currentIds.has(r.id));

      // Instant local update
      setFileSnapshot(next);

      try {
        if (toDelete.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("files").delete().in("id", toDelete);
        }
        if (toInsert.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("files").insert(toInsert.map(toInsertRow));
        }
        for (const r of toUpdate) {
          const orig = current.find((c) => c.id === r.id);
          if (!orig || JSON.stringify(orig) === JSON.stringify(r)) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("files").update(toInsertRow(r)).eq("id", r.id);
        }
      } catch {
        /* saved locally */
      }
    },
    upsertMany: async (incoming: FileRecord[]) => {
      if (incoming.length === 0) return;
      const current = [...fileRecords];
      const byCode = new Map(
        current.filter((r) => r.fileCode).map((r) => [r.fileCode.toLowerCase(), r]),
      );
      const seenIncomingCodes = new Set<string>();
      const inserts: ReturnType<typeof toInsertRow>[] = [];
      const updates: { id: string; row: ReturnType<typeof toInsertRow> }[] = [];
      
      const nextRecords = [...current];

      for (const r of incoming) {
        const normalizedCode = r.fileCode.trim().toLowerCase();
        if (normalizedCode && seenIncomingCodes.has(normalizedCode)) continue;
        if (normalizedCode) seenIncomingCodes.add(normalizedCode);
        const existing = normalizedCode ? byCode.get(normalizedCode) : undefined;
        if (existing) {
          const updatedRec = { ...existing, ...r, history: existing.history };
          updates.push({ id: existing.id, row: toInsertRow(updatedRec) });
          const idx = nextRecords.findIndex((x) => x.id === existing.id);
          if (idx !== -1) nextRecords[idx] = updatedRec;
        } else {
          inserts.push(toInsertRow(r));
          nextRecords.push(r);
        }
      }

      // Instant local update
      setFileSnapshot(nextRecords);

      try {
        if (inserts.length) {
          const BATCH = 500;
          for (let i = 0; i < inserts.length; i += BATCH) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("files").insert(inserts.slice(i, i + BATCH));
          }
        }
        for (const u of updates) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("files").update(u.row).eq("id", u.id);
        }
      } catch {
        /* saved locally */
      }
    },
    update: async (id: string, patch: Partial<FileRecord>) => {
      // Instant local update
      const current = fileRecords;
      const idx = current.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const updated = { ...current[idx], ...patch };
        const next = [...current];
        next[idx] = updated;
        setFileSnapshot(next);
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("files").update(toRow(patch)).eq("id", id);
      } catch {
        /* saved locally */
      }
    },
    remove: async (id: string) => {
      const next = fileRecords.filter((r) => r.id !== id);
      setFileSnapshot(next);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("files").delete().eq("id", id);
      } catch {
        /* saved locally */
      }
    },
    clear: async () => {
      setFileSnapshot([]);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("files")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
      } catch {
        /* saved locally */
      }
    },
  };
}

const HEADER_MAP: Record<string, keyof FileRecord> = {
  "file code": "fileCode",
  code: "fileCode",
  "document title": "documentTitle",
  title: "documentTitle",
  department: "department",
  "cabinet number": "cabinetNumber",
  cabinet: "cabinetNumber",
  row: "row",
  side: "side",
  "full location code": "fullLocationCode",
  location: "fullLocationCode",
  year: "year",
  "current status": "currentStatus",
  status: "currentStatus",
  "issued to": "issuedTo",
};

export function rowsToRecords(rows: Record<string, unknown>[]): FileRecord[] {
  return rows
    .map((raw) => {
      const r: Partial<FileRecord> = {};
      for (const [k, v] of Object.entries(raw)) {
        const key = HEADER_MAP[k.trim().toLowerCase()];
        if (key) (r as Record<string, unknown>)[key] = v == null ? "" : String(v);
      }
      if (!r.fileCode && !r.documentTitle) return null;
      const status = (r.currentStatus as string) || "Available";
      const rec: FileRecord = {
        id: newId(),
        fileCode: r.fileCode ?? "",
        documentTitle: r.documentTitle ?? "",
        department: r.department ?? "",
        cabinetNumber: r.cabinetNumber ?? "",
        row: r.row ?? "",
        side: r.side ?? "",
        fullLocationCode: r.fullLocationCode ?? "",
        year: r.year ?? "",
        currentStatus: (["Available", "Issued", "Lost", "Archived", "Record Room"].includes(status)
          ? status
          : "Available") as FileStatus,
        issuedTo: r.issuedTo ?? "",
        history: [],
      };
      return rec;
    })
    .filter((x): x is FileRecord => x !== null);
}
