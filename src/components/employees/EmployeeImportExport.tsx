import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { Download, Upload, FileSpreadsheet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeStore, toRow, type Employee } from "@/lib/employee-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HEADER_MAP: Record<string, keyof Omit<Employee, "id" | "createdAt">> = {
  "employee id": "employeeId",
  "emp id": "employeeId",
  "id": "employeeId",
  "full name": "fullName",
  "name": "fullName",
  "father's name": "fatherName",
  "fathers name": "fatherName",
  "father name": "fatherName",
  "cnic": "cnic",
  "cnic number": "cnic",
  "date of birth": "dob",
  "dob": "dob",
  "gender": "gender",
  "contact (personal)": "contactPersonal",
  "contact personal": "contactPersonal",
  "personal contact": "contactPersonal",
  "contact (emergency)": "contactEmergency",
  "contact emergency": "contactEmergency",
  "emergency contact": "contactEmergency",
  "personal email": "emailPersonal",
  "official email": "emailOfficial",
  "current address": "addressCurrent",
  "permanent address": "addressPermanent",
  "department": "department",
  "designation": "designation",
  "reporting to": "reportingTo",
  "joining date": "joiningDate",
  "employment status": "employmentStatus",
  "job status": "jobStatus",
  "bank name": "bankName",
  "account / iban": "accountIban",
  "account/iban": "accountIban",
  "iban": "accountIban",
  "account": "accountIban",
  "basic salary": "basicSalary",
  "allowances": "allowances",
  "gross salary": "grossSalary",
  "deductions": "deductions",
  "net payable": "netPayable",
  "core technical skills": "coreSkills",
  "core skills": "coreSkills",
  "soft skills": "softSkills",
  "current skill level": "skillLevel",
  "skill level": "skillLevel",
  "ai tools literacy": "aiLiteracy",
  "ai literacy": "aiLiteracy",
  "training required?": "trainingRequired",
  "training required": "trainingRequired",
  "last training": "lastTraining",
  "performance rating": "performanceRating",
};

function blank(): Omit<Employee, "id" | "createdAt"> {
  return {
    employeeId: "", fullName: "", fatherName: "", cnic: "", dob: "", gender: "",
    contactPersonal: "", contactEmergency: "", emailPersonal: "", emailOfficial: "",
    addressCurrent: "", addressPermanent: "", department: "", designation: "",
    reportingTo: "", joiningDate: "", employmentStatus: "", jobStatus: "",
    bankName: "", accountIban: "", basicSalary: "", allowances: "", grossSalary: "",
    deductions: "", netPayable: "", coreSkills: "", softSkills: "", skillLevel: "",
    aiLiteracy: "", trainingRequired: "", lastTraining: "", performanceRating: "",
    source: "import",
  };
}

function excelDateToISO(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

export function EmployeeImportExport() {
  const { employees, reload } = useEmployeeStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1, defval: "", blankrows: false,
      });
      if (matrix.length < 2) {
        toast.error("Sheet khali hai.");
        return;
      }
      const headers = (matrix[0] as unknown[]).map((h) => String(h ?? "").trim().toLowerCase());
      const dateFields = new Set(["dob", "joiningDate", "lastTraining"]);
      const records = matrix.slice(1).map((row) => {
        const e = blank();
        headers.forEach((h, i) => {
          const key = HEADER_MAP[h];
          if (!key) return;
          const raw = (row as unknown[])[i];
          if (raw === undefined || raw === null || raw === "") return;
          const val = dateFields.has(key) ? excelDateToISO(raw) : String(raw).trim();
          (e as Record<string, string>)[key] = val;
        });
        return e;
      }).filter((e) => e.fullName);

      if (!records.length) {
        toast.error("Koi valid rows nahi mili. Headers check karein (Full Name required).");
        return;
      }

      const rows = records.map(toRow);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("employees").insert(rows);
      if (error) throw error;
      toast.success(`Imported ${records.length} employees.`);
      await reload();
    } catch (err) {
      console.error(err);
      toast.error("Excel parse / import fail hua.");
    } finally {
      setBusy(false);
    }
  }

  function exportXlsx() {
    if (employees.length === 0) {
      toast.error("Koi employees nahi hain.");
      return;
    }
    const rows = employees.map((e) => ({
      "Employee ID": e.employeeId,
      "Full Name": e.fullName,
      "Father's Name": e.fatherName,
      "CNIC": e.cnic,
      "Date of Birth": e.dob,
      "Gender": e.gender,
      "Contact (Personal)": e.contactPersonal,
      "Contact (Emergency)": e.contactEmergency,
      "Personal Email": e.emailPersonal,
      "Official Email": e.emailOfficial,
      "Current Address": e.addressCurrent,
      "Permanent Address": e.addressPermanent,
      "Department": e.department,
      "Designation": e.designation,
      "Reporting To": e.reportingTo,
      "Joining Date": e.joiningDate,
      "Employment Status": e.employmentStatus,
      "Job Status": e.jobStatus,
      "Bank Name": e.bankName,
      "Account / IBAN": e.accountIban,
      "Basic Salary": e.basicSalary,
      "Allowances": e.allowances,
      "Gross Salary": e.grossSalary,
      "Deductions": e.deductions,
      "Net Payable": e.netPayable,
      "Core Technical Skills": e.coreSkills,
      "Soft Skills": e.softSkills,
      "Current Skill Level": e.skillLevel,
      "AI Tools Literacy": e.aiLiteracy,
      "Training Required?": e.trainingRequired,
      "Last Training": e.lastTraining,
      "Performance Rating": e.performanceRating,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `employees-${stamp}.xlsx`);
    toast.success(`Exported ${employees.length} employees.`);
  }

  function downloadTemplate() {
    const headers = Object.keys(HEADER_MAP)
      .map((h) => h.replace(/\b\w/g, (c) => c.toUpperCase()));
    // dedupe via map values
    const cols = [
      "Employee ID","Full Name","Father's Name","CNIC","Date of Birth","Gender",
      "Contact (Personal)","Contact (Emergency)","Personal Email","Official Email",
      "Current Address","Permanent Address","Department","Designation","Reporting To",
      "Joining Date","Employment Status","Job Status","Bank Name","Account / IBAN",
      "Basic Salary","Allowances","Gross Salary","Deductions","Net Payable",
      "Core Technical Skills","Soft Skills","Current Skill Level","AI Tools Literacy",
      "Training Required?","Last Training","Performance Rating",
    ];
    void headers;
    const ws = XLSX.utils.aoa_to_sheet([cols]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `employees-template.xlsx`);
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Employees — Import / Export</h3>
          <p className="text-xs text-muted-foreground">
            Excel se bulk employees upload karein ya backup download karein
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => !busy && inputRef.current?.click()}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all ${
            dragging
              ? "border-primary bg-primary-soft scale-[1.01]"
              : "border-border bg-surface hover:border-primary/50 hover:bg-primary-soft/40"
          } ${busy ? "opacity-60 pointer-events-none" : ""}`}
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
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {busy ? "Importing…" : "Drop employees Excel here"}
              </p>
              <p className="text-sm text-muted-foreground">
                Headers auto-map. Full Name required.
              </p>
            </div>
            <Button size="sm" variant="link" type="button" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
              Download blank template
            </Button>
          </div>
        </motion.div>

        <div className="rounded-xl border bg-surface p-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">{employees.length} employees ready</p>
              <p className="text-xs text-muted-foreground">
                Full personal, payroll &amp; skill columns
              </p>
            </div>
          </div>
          <Button className="mt-4 w-full" onClick={exportXlsx} disabled={employees.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download .xlsx
          </Button>
        </div>
      </div>
    </section>
  );
}
