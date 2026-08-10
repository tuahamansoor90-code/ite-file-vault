import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Gender = "Male" | "Female" | "Other";
export type EmploymentStatus = "Permanent" | "Contract" | "Probation" | "Intern";
export type JobStatus = "Active" | "On Leave" | "Resigned" | "Terminated";
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type AiLiteracy = "None" | "Basic" | "Intermediate" | "Advanced";
export type YesNo = "Yes" | "No";

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  dob: string;
  gender: Gender | "";
  contactPersonal: string;
  contactEmergency: string;
  emailPersonal: string;
  emailOfficial: string;
  addressCurrent: string;
  addressPermanent: string;
  department: string;
  designation: string;
  reportingTo: string;
  joiningDate: string;
  employmentStatus: EmploymentStatus | "";
  jobStatus: JobStatus | "";
  bankName: string;
  accountIban: string;
  basicSalary: string;
  allowances: string;
  grossSalary: string;
  deductions: string;
  netPayable: string;
  coreSkills: string;
  softSkills: string;
  skillLevel: SkillLevel | "";
  aiLiteracy: AiLiteracy | "";
  trainingRequired: YesNo | "";
  lastTraining: string;
  performanceRating: string;
  source?: string;
  createdAt?: string;
}

const OFFLINE_CACHE_KEY = "employee_index_offline_cache_v2";

function loadLocalCache(): Employee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to read local employee cache", e);
  }
  return [];
}

function saveLocalCache(records: Employee[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Failed to save local employee cache", e);
  }
}

const initialCached = loadLocalCache();
let employeeRecords: Employee[] = initialCached;
let employeeHydrated = true;
let employeeLoadPromise: Promise<void> | null = null;
let employeeRealtimeReady = false;
const employeeSubscribers = new Set<() => void>();

function notifyEmployees() {
  employeeSubscribers.forEach((listener) => listener());
}

function setEmployeeSnapshot(records: Employee[]) {
  employeeRecords = records;
  employeeHydrated = true;
  saveLocalCache(records);
  notifyEmployees();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(r: any): Employee {
  return {
    id: r.id,
    employeeId: r.employee_id ?? "",
    fullName: r.full_name ?? "",
    fatherName: r.father_name ?? "",
    cnic: r.cnic ?? "",
    dob: r.dob ?? "",
    gender: (r.gender ?? "") as Employee["gender"],
    contactPersonal: r.contact_personal ?? "",
    contactEmergency: r.contact_emergency ?? "",
    emailPersonal: r.email_personal ?? "",
    emailOfficial: r.email_official ?? "",
    addressCurrent: r.address_current ?? "",
    addressPermanent: r.address_permanent ?? "",
    department: r.department ?? "",
    designation: r.designation ?? "",
    reportingTo: r.reporting_to ?? "",
    joiningDate: r.joining_date ?? "",
    employmentStatus: (r.employment_status ?? "") as Employee["employmentStatus"],
    jobStatus: (r.job_status ?? "") as Employee["jobStatus"],
    bankName: r.bank_name ?? "",
    accountIban: r.account_iban ?? "",
    basicSalary: r.basic_salary != null ? String(r.basic_salary) : "",
    allowances: r.allowances != null ? String(r.allowances) : "",
    grossSalary: r.gross_salary != null ? String(r.gross_salary) : "",
    deductions: r.deductions != null ? String(r.deductions) : "",
    netPayable: r.net_payable != null ? String(r.net_payable) : "",
    coreSkills: r.core_skills ?? "",
    softSkills: r.soft_skills ?? "",
    skillLevel: (r.skill_level ?? "") as Employee["skillLevel"],
    aiLiteracy: (r.ai_literacy ?? "") as Employee["aiLiteracy"],
    trainingRequired: (r.training_required ?? "") as Employee["trainingRequired"],
    lastTraining: r.last_training ?? "",
    performanceRating: r.performance_rating ?? "",
    source: r.source ?? "admin",
    createdAt: r.created_at,
  };
}

function num(v: string) {
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
function dateOrNull(v: string) {
  return v && v.trim() ? v : null;
}

export function toRow(e: Omit<Employee, "id" | "createdAt">) {
  return {
    employee_id: e.employeeId || null,
    full_name: e.fullName,
    father_name: e.fatherName || null,
    cnic: e.cnic || null,
    dob: dateOrNull(e.dob),
    gender: e.gender || null,
    contact_personal: e.contactPersonal || null,
    contact_emergency: e.contactEmergency || null,
    email_personal: e.emailPersonal || null,
    email_official: e.emailOfficial || null,
    address_current: e.addressCurrent || null,
    address_permanent: e.addressPermanent || null,
    department: e.department || null,
    designation: e.designation || null,
    reporting_to: e.reportingTo || null,
    joining_date: dateOrNull(e.joiningDate),
    employment_status: e.employmentStatus || null,
    job_status: e.jobStatus || null,
    bank_name: e.bankName || null,
    account_iban: e.accountIban || null,
    basic_salary: num(e.basicSalary),
    allowances: num(e.allowances),
    gross_salary: num(e.grossSalary),
    deductions: num(e.deductions),
    net_payable: num(e.netPayable),
    core_skills: e.coreSkills || null,
    soft_skills: e.softSkills || null,
    skill_level: e.skillLevel || null,
    ai_literacy: e.aiLiteracy || null,
    training_required: e.trainingRequired || null,
    last_training: e.lastTraining || null,
    performance_rating: e.performanceRating || null,
    source: e.source || "admin",
  };
}

async function syncRemoteEmployees() {
  if (employeeLoadPromise) return employeeLoadPromise;
  if (typeof window !== "undefined" && !navigator.onLine) {
    return Promise.resolve();
  }
  employeeLoadPromise = (async () => {
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
            .from("employees")
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
        setEmployeeSnapshot(allRows.map(fromRow));
      }
    } catch {
      /* keep local cache */
    } finally {
      employeeLoadPromise = null;
    }
  })();
  return employeeLoadPromise;
}

function ensureEmployeesRealtime() {
  if (employeeRealtimeReady || typeof window === "undefined") return;
  employeeRealtimeReady = true;
  try {
    supabase
      .channel("employees-store-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        void syncRemoteEmployees();
      })
      .subscribe();
  } catch {
    /* ignore offline */
  }
}

export function useEmployeeStore() {
  const [, forceRender] = useState(0);

  const load = useCallback(async () => {
    await syncRemoteEmployees();
  }, []);

  useEffect(() => {
    const rerender = () => forceRender((tick) => tick + 1);
    employeeSubscribers.add(rerender);
    ensureEmployeesRealtime();
    void syncRemoteEmployees();
    return () => {
      employeeSubscribers.delete(rerender);
    };
  }, []);

  return {
    employees: employeeRecords,
    hydrated: true,
    reload: load,
    add: async (e: Omit<Employee, "id" | "createdAt">) => {
      const generatedId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const newEmp: Employee = {
        ...e,
        id: generatedId,
        createdAt: new Date().toISOString(),
      };
      setEmployeeSnapshot([newEmp, ...employeeRecords]);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("employees").insert(toRow(e));
      } catch {
        /* saved locally */
      }
    },
    update: async (id: string, patch: Omit<Employee, "id" | "createdAt">) => {
      const current = employeeRecords;
      const idx = current.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const updated = { ...current[idx], ...patch };
        const next = [...current];
        next[idx] = updated;
        setEmployeeSnapshot(next);
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("employees").update(toRow(patch)).eq("id", id);
      } catch {
        /* saved locally */
      }
    },
    remove: async (id: string) => {
      const next = employeeRecords.filter((r) => r.id !== id);
      setEmployeeSnapshot(next);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("employees").delete().eq("id", id);
      } catch {
        /* saved locally */
      }
    },
  };
}

export function nextEmployeeId(existing: string[]): string {
  const re = /^(.*?)(\d+)\s*$/;
  const counts: Record<string, { max: number; pad: number; count: number }> = {};
  for (const c of existing) {
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
  let prefix = "EMP-";
  let pad = 3;
  let max = 0;
  let bestCount = 0;
  for (const [p, e] of Object.entries(counts)) {
    if (e.count > bestCount) {
      bestCount = e.count;
      prefix = p;
      pad = e.pad;
      max = e.max;
    }
  }
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}
