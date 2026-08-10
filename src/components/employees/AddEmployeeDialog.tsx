import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles, User, Briefcase, Wallet, GraduationCap, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  useEmployeeStore,
  nextEmployeeId,
  type Employee,
} from "@/lib/employee-store";
import { toast } from "sonner";
import { handleEnterFocusNext } from "@/lib/focus-next";

const empty: Omit<Employee, "id"> = {
  employeeId: "",
  fullName: "",
  fatherName: "",
  cnic: "",
  dob: "",
  gender: "",
  contactPersonal: "",
  contactEmergency: "",
  emailPersonal: "",
  emailOfficial: "",
  addressCurrent: "",
  addressPermanent: "",
  department: "",
  designation: "",
  reportingTo: "",
  joiningDate: "",
  employmentStatus: "",
  jobStatus: "Active",
  bankName: "",
  accountIban: "",
  basicSalary: "",
  allowances: "",
  grossSalary: "",
  deductions: "",
  netPayable: "",
  coreSkills: "",
  softSkills: "",
  skillLevel: "",
  aiLiteracy: "",
  trainingRequired: "",
  lastTraining: "",
  performanceRating: "",
};

const GENDERS = ["Male", "Female", "Other"] as const;
const EMP_STATUS = ["Permanent", "Contract", "Probation", "Intern"] as const;
const JOB_STATUS = ["Active", "On Leave", "Resigned", "Terminated"] as const;
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const AI_LITERACY = ["None", "Basic", "Intermediate", "Advanced"] as const;
const YES_NO = ["Yes", "No"] as const;

export function AddEmployeeDialog({
  trigger,
  employee,
  open: openProp,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  employee?: Employee;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const { employees, add, update } = useEmployeeStore();
  const isEdit = !!employee;
  const [openInner, setOpenInner] = useState(false);
  const open = openProp ?? openInner;
  const setOpen = (o: boolean) => {
    onOpenChange?.(o);
    if (openProp === undefined) setOpenInner(o);
  };
  const [form, setForm] = useState<Omit<Employee, "id">>(empty);
  const [autoId, setAutoId] = useState(!isEdit);

  const suggested = useMemo(
    () => nextEmployeeId(employees.map((e) => e.employeeId).filter(Boolean)),
    [employees],
  );

  useEffect(() => {
    if (!open) return;
    if (isEdit && employee) {
      // strip id/createdAt
      const { id: _i, createdAt: _c, ...rest } = employee;
      setForm(rest);
      setAutoId(false);
    } else if (autoId) {
      setForm((f) => ({ ...f, employeeId: suggested }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id]);

  useEffect(() => {
    if (open && !isEdit && autoId) setForm((f) => ({ ...f, employeeId: suggested }));
  }, [open, autoId, suggested, isEdit]);

  // auto compute gross & net
  useEffect(() => {
    const basic = parseFloat(form.basicSalary) || 0;
    const allow = parseFloat(form.allowances) || 0;
    const ded = parseFloat(form.deductions) || 0;
    const gross = basic + allow;
    const net = gross - ded;
    setForm((f) => {
      const g = basic || allow ? String(gross) : f.grossSalary;
      const n = basic || allow || ded ? String(net) : f.netPayable;
      if (f.grossSalary === g && f.netPayable === n) return f;
      return { ...f, grossSalary: g, netPayable: n };
    });
  }, [form.basicSalary, form.allowances, form.deductions]);

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (
      form.employeeId.trim() &&
      employees.some(
        (e) =>
          e.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase() &&
          e.id !== employee?.id,
      )
    ) {
      toast.error("Employee ID already exists");
      return;
    }
    try {
      const payload = { ...form, fullName: form.fullName.trim() };
      if (isEdit && employee) {
        await update(employee.id, payload);
        toast.success(`Employee updated (${payload.employeeId || payload.fullName})`);
      } else {
        await add(payload);
        toast.success(`Employee added (${payload.employeeId || payload.fullName})`);
        setForm(empty);
        setAutoId(true);
      }
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(isEdit ? "Could not update employee" : "Could not save employee");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {(trigger || !isEdit) && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "Add a new employee"}</DialogTitle>
          <DialogDescription>
            Fill in the employee's personal, job, payroll and skills information.
          </DialogDescription>
        </DialogHeader>

        <div
          className="max-h-[65vh] space-y-6 overflow-y-auto pr-1"
          onKeyDownCapture={handleEnterFocusNext}
        >
          {/* Identity */}
          <Section title="Identity" icon={User}>
            <Field label="Employee ID" full>
              <div className="flex items-center gap-2">
                <Input
                  value={form.employeeId}
                  className="font-mono"
                  onChange={(e) => {
                    setAutoId(false);
                    set("employeeId", e.target.value);
                  }}
                />
                {autoId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" /> Auto
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoId(true);
                      set("employeeId", suggested);
                    }}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Use {suggested}
                  </button>
                )}
              </div>
            </Field>
            <Field label="Full Name *">
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </Field>
            <Field label="Father's Name">
              <Input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
            </Field>
            <Field label="CNIC Number">
              <Input
                value={form.cnic}
                placeholder="00000-0000000-0"
                onChange={(e) => set("cnic", e.target.value)}
              />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={(v) => set("gender", v as Employee["gender"]) }>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          {/* Contact */}
          <Section title="Contact" icon={Phone}>
            <Field label="Contact (Personal)">
              <Input value={form.contactPersonal} onChange={(e) => set("contactPersonal", e.target.value)} />
            </Field>
            <Field label="Contact (Emergency)">
              <Input value={form.contactEmergency} onChange={(e) => set("contactEmergency", e.target.value)} />
            </Field>
            <Field label="Personal Email">
              <Input type="email" value={form.emailPersonal} onChange={(e) => set("emailPersonal", e.target.value)} />
            </Field>
            <Field label="Official Email">
              <Input type="email" value={form.emailOfficial} onChange={(e) => set("emailOfficial", e.target.value)} />
            </Field>
          </Section>

          {/* Address */}
          <Section title="Address" icon={MapPin}>
            <Field label="Current Address" full>
              <Textarea rows={2} value={form.addressCurrent} onChange={(e) => set("addressCurrent", e.target.value)} />
            </Field>
            <Field label="Permanent Address" full>
              <Textarea rows={2} value={form.addressPermanent} onChange={(e) => set("addressPermanent", e.target.value)} />
            </Field>
          </Section>

          {/* Job */}
          <Section title="Job Information" icon={Briefcase}>
            <Field label="Department">
              <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
            </Field>
            <Field label="Designation">
              <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} />
            </Field>
            <Field label="Reporting To">
              <Input value={form.reportingTo} onChange={(e) => set("reportingTo", e.target.value)} />
            </Field>
            <Field label="Joining Date">
              <Input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} />
            </Field>
            <Field label="Employment Status">
              <Select value={form.employmentStatus} onValueChange={(v) => set("employmentStatus", v as Employee["employmentStatus"]) }>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {EMP_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Job Status">
              <Select value={form.jobStatus} onValueChange={(v) => set("jobStatus", v as Employee["jobStatus"]) }>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {JOB_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          {/* Payroll */}
          <Section title="Payroll" icon={Wallet}>
            <Field label="Bank Name">
              <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </Field>
            <Field label="Account / IBAN">
              <Input value={form.accountIban} className="font-mono" onChange={(e) => set("accountIban", e.target.value)} />
            </Field>
            <Field label="Basic Salary">
              <Input type="number" inputMode="decimal" value={form.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} />
            </Field>
            <Field label="Allowances">
              <Input type="number" inputMode="decimal" value={form.allowances} onChange={(e) => set("allowances", e.target.value)} />
            </Field>
            <Field label="Gross Salary (auto)">
              <Input value={form.grossSalary} readOnly className="bg-muted/40" />
            </Field>
            <Field label="Deductions">
              <Input type="number" inputMode="decimal" value={form.deductions} onChange={(e) => set("deductions", e.target.value)} />
            </Field>
            <Field label="Net Payable (auto)" full>
              <Input value={form.netPayable} readOnly className="bg-muted/40 font-semibold" />
            </Field>
          </Section>

          {/* Skills */}
          <Section title="Skills & Training" icon={GraduationCap}>
            <Field label="Core Technical Skills" full>
              <Textarea rows={2} placeholder="Comma separated" value={form.coreSkills} onChange={(e) => set("coreSkills", e.target.value)} />
            </Field>
            <Field label="Soft Skills" full>
              <Textarea rows={2} placeholder="Comma separated" value={form.softSkills} onChange={(e) => set("softSkills", e.target.value)} />
            </Field>
            <Field label="Current Skill Level">
              <Select value={form.skillLevel} onValueChange={(v) => set("skillLevel", v as Employee["skillLevel"]) }>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="AI Tools Literacy">
              <Select value={form.aiLiteracy} onValueChange={(v) => set("aiLiteracy", v as Employee["aiLiteracy"]) }>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {AI_LITERACY.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Training Required?">
              <Select value={form.trainingRequired} onValueChange={(v) => set("trainingRequired", v as Employee["trainingRequired"]) }>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {YES_NO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Last Training">
              <Input value={form.lastTraining} placeholder="e.g. Leadership 101 — Mar 2025" onChange={(e) => set("lastTraining", e.target.value)} />
            </Field>
            <Field label="Performance Rating">
              <Input value={form.performanceRating} placeholder="e.g. 4.2 / 5" onChange={(e) => set("performanceRating", e.target.value)} />
            </Field>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? "Save changes" : "Add Employee"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
