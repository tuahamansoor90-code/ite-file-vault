import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Database, Send, User, Briefcase, Wallet, GraduationCap, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toRow, type Employee } from "@/lib/employee-store";
import { toast } from "sonner";

export const Route = createFileRoute("/employee-form")({
  head: () => ({
    meta: [
      { title: "Employee Information Form" },
      {
        name: "description",
        content: "Submit your employee information securely. Takes about 3-5 minutes.",
      },
    ],
  }),
  component: PublicEmployeeForm,
});

type FormState = Omit<Employee, "id" | "createdAt">;

const empty: FormState = {
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
  source: "public-form",
};

const GENDERS = ["Male", "Female", "Other"] as const;
const EMP_STATUS = ["Permanent", "Contract", "Probation", "Intern"] as const;
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const AI_LITERACY = ["None", "Basic", "Intermediate", "Advanced"] as const;
const YES_NO = ["Yes", "No"] as const;

function PublicEmployeeForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("employees").insert(toRow(form));
      if (error) throw error;
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-surface">
        <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success"
          >
            <CheckCircle2 className="h-9 w-9" />
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Thank you!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your information has been submitted successfully. The HR team will review it shortly.
          </p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => {
              setForm(empty);
              setDone(false);
            }}
          >
            Submit another response
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-16">
      <header className="border-b bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <Database className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-foreground">Employee Information Form</h1>
            <p className="text-xs text-muted-foreground">
              Please fill in your details. Only Full Name is required.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Section title="Identity" icon={User}>
          <Field label="Full Name *" full>
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required maxLength={150} />
          </Field>
          <Field label="Father's Name">
            <Input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} maxLength={150} />
          </Field>
          <Field label="CNIC Number">
            <Input value={form.cnic} placeholder="00000-0000000-0" onChange={(e) => set("cnic", e.target.value)} maxLength={20} />
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

        <Section title="Contact" icon={Phone}>
          <Field label="Contact (Personal)">
            <Input value={form.contactPersonal} onChange={(e) => set("contactPersonal", e.target.value)} maxLength={30} />
          </Field>
          <Field label="Contact (Emergency)">
            <Input value={form.contactEmergency} onChange={(e) => set("contactEmergency", e.target.value)} maxLength={30} />
          </Field>
          <Field label="Personal Email">
            <Input type="email" value={form.emailPersonal} onChange={(e) => set("emailPersonal", e.target.value)} maxLength={255} />
          </Field>
          <Field label="Official Email">
            <Input type="email" value={form.emailOfficial} onChange={(e) => set("emailOfficial", e.target.value)} maxLength={255} />
          </Field>
        </Section>

        <Section title="Address" icon={MapPin}>
          <Field label="Current Address" full>
            <Textarea rows={2} value={form.addressCurrent} onChange={(e) => set("addressCurrent", e.target.value)} maxLength={500} />
          </Field>
          <Field label="Permanent Address" full>
            <Textarea rows={2} value={form.addressPermanent} onChange={(e) => set("addressPermanent", e.target.value)} maxLength={500} />
          </Field>
        </Section>

        <Section title="Job Information" icon={Briefcase}>
          <Field label="Department">
            <Input value={form.department} onChange={(e) => set("department", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Reporting To">
            <Input value={form.reportingTo} onChange={(e) => set("reportingTo", e.target.value)} maxLength={150} />
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
        </Section>

        <Section title="Payroll (optional)" icon={Wallet}>
          <Field label="Bank Name">
            <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Account / IBAN">
            <Input value={form.accountIban} className="font-mono" onChange={(e) => set("accountIban", e.target.value)} maxLength={50} />
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

        <Section title="Skills & Training" icon={GraduationCap}>
          <Field label="Core Technical Skills" full>
            <Textarea rows={2} placeholder="Comma separated" value={form.coreSkills} onChange={(e) => set("coreSkills", e.target.value)} maxLength={500} />
          </Field>
          <Field label="Soft Skills" full>
            <Textarea rows={2} placeholder="Comma separated" value={form.softSkills} onChange={(e) => set("softSkills", e.target.value)} maxLength={500} />
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
            <Input value={form.lastTraining} placeholder="e.g. Leadership 101 — Mar 2025" onChange={(e) => set("lastTraining", e.target.value)} maxLength={200} />
          </Field>
        </Section>

        <div className="sticky bottom-4 z-10 rounded-2xl border bg-card p-4 shadow-[var(--shadow-lift)]">
          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            <Send className="mr-2 h-4 w-4" />
            {submitting ? "Submitting…" : "Submit my information"}
          </Button>
        </div>
      </form>
    </main>
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
    <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
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
