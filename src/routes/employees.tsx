import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Trash2, Mail, Phone, Briefcase, X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/file-index/AppShell";
import { AddEmployeeDialog } from "@/components/employees/AddEmployeeDialog";
import { ShareFormDialog } from "@/components/employees/ShareFormDialog";
import { useEmployeeStore, type Employee } from "@/lib/employee-store";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employees — File Vault" },
      { name: "description", content: "Manage employee records, payroll, skills and training." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const { employees, hydrated, remove } = useEmployeeStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [
        e.employeeId,
        e.fullName,
        e.cnic,
        e.department,
        e.designation,
        e.emailOfficial,
        e.contactPersonal,
      ]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [employees, query]);

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  if (!hydrated) return <div className="min-h-screen bg-surface" />;

  if (employees.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card p-16 text-center">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">No employees yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first employee record, or share the public form link.
          </p>
          <div className="mt-6 flex gap-2">
            <ShareFormDialog />
            <AddEmployeeDialog />
          </div>
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Employees</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {employees.length} {employees.length === 1 ? "record" : "records"} on file
          </p>
        </div>
        <div className="flex gap-2">
          <ShareFormDialog />
          <AddEmployeeDialog />
        </div>
      </div>


      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ID, CNIC, department, designation, email…"
          className="h-12 rounded-xl pl-11 text-base shadow-[var(--shadow-soft)]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
          <div className="hidden sm:grid grid-cols-[110px_1fr_160px_120px] gap-4 border-b bg-surface px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>ID</span>
            <span>Name</span>
            <span>Designation</span>
            <span>Status</span>
          </div>
          <ul className="max-h-[70vh] divide-y overflow-y-auto">
            {filtered.map((e) => (
              <li
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`flex cursor-pointer flex-col gap-1 px-4 py-3 transition-colors sm:grid sm:grid-cols-[110px_1fr_160px_120px] sm:items-center sm:gap-4 sm:px-5 ${
                  selectedId === e.id ? "bg-primary-soft" : "hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-2 sm:contents">
                  <span className="truncate font-mono text-sm text-foreground">
                    {e.employeeId || "—"}
                  </span>
                  <div className="sm:hidden">
                    <StatusPill status={e.jobStatus} />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{e.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.department || "—"}</p>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {e.designation || "—"}
                </span>
                <div className="hidden sm:block">
                  <StatusPill status={e.jobStatus} />
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="p-10 text-center text-sm text-muted-foreground">
                No matches for "{query}"
              </li>
            )}
          </ul>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <AnimatePresence mode="wait">
            {selected ? (
              <EmployeeDetail
                key={selected.id}
                employee={selected}
                onClose={() => setSelectedId(null)}
                onDelete={() => {
                  if (confirm(`Delete ${selected.fullName}?`)) {
                    remove(selected.id);
                    setSelectedId(null);
                  }
                }}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-center"
              >
                <Users className="mb-3 h-8 w-8 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Select an employee</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click any row to see full personal, job and payroll details.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: Employee["jobStatus"] }) {
  const tone =
    status === "Active"
      ? "bg-success/10 text-success"
      : status === "On Leave"
        ? "bg-warning/10 text-warning"
        : status === "Resigned" || status === "Terminated"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {status || "—"}
    </span>
  );
}

function EmployeeDetail({
  employee,
  onClose,
  onDelete,
}: {
  employee: Employee;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">{employee.employeeId || "—"}</p>
          <h3 className="truncate text-lg font-semibold text-foreground">{employee.fullName}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {employee.designation || "—"} · {employee.department || "—"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Edit">
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <AddEmployeeDialog employee={employee} open={editOpen} onOpenChange={setEditOpen} />

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <DetailGroup title="Personal">
          <Row label="Father's Name" value={employee.fatherName} />
          <Row label="CNIC" value={employee.cnic} mono />
          <Row label="Date of Birth" value={employee.dob} />
          <Row label="Gender" value={employee.gender} />
        </DetailGroup>

        <DetailGroup title="Contact" icon={Phone}>
          <Row label="Personal" value={employee.contactPersonal} />
          <Row label="Emergency" value={employee.contactEmergency} />
          <Row label="Personal Email" value={employee.emailPersonal} icon={Mail} />
          <Row label="Official Email" value={employee.emailOfficial} icon={Mail} />
        </DetailGroup>

        <DetailGroup title="Address">
          <Row label="Current" value={employee.addressCurrent} multiline />
          <Row label="Permanent" value={employee.addressPermanent} multiline />
        </DetailGroup>

        <DetailGroup title="Job" icon={Briefcase}>
          <Row label="Reporting To" value={employee.reportingTo} />
          <Row label="Joining Date" value={employee.joiningDate} />
          <Row label="Employment Status" value={employee.employmentStatus} />
          <Row label="Job Status" value={employee.jobStatus} />
        </DetailGroup>

        <DetailGroup title="Payroll">
          <Row label="Bank" value={employee.bankName} />
          <Row label="Account / IBAN" value={employee.accountIban} mono />
          <Row label="Basic Salary" value={employee.basicSalary} />
          <Row label="Allowances" value={employee.allowances} />
          <Row label="Gross Salary" value={employee.grossSalary} />
          <Row label="Deductions" value={employee.deductions} />
          <Row label="Net Payable" value={employee.netPayable} highlight />
        </DetailGroup>

        <DetailGroup title="Skills & Training">
          <Row label="Core Skills" value={employee.coreSkills} multiline />
          <Row label="Soft Skills" value={employee.softSkills} multiline />
          <Row label="Skill Level" value={employee.skillLevel} />
          <Row label="AI Tools Literacy" value={employee.aiLiteracy} />
          <Row label="Training Required" value={employee.trainingRequired} />
          <Row label="Last Training" value={employee.lastTraining} />
          <Row label="Performance Rating" value={employee.performanceRating} />
        </DetailGroup>
      </div>
    </motion.div>
  );
}

function DetailGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      <dl className="space-y-1.5 rounded-xl border bg-surface p-3">{children}</dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  multiline,
  highlight,
  icon: Icon,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  multiline?: boolean;
  highlight?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={`grid gap-1 ${multiline ? "" : "sm:grid-cols-[140px_1fr] sm:items-baseline"}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`flex items-start gap-1.5 text-sm ${mono ? "font-mono" : ""} ${
          highlight ? "font-semibold text-primary" : "text-foreground"
        } ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {Icon && value && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 break-words">{value || "—"}</span>
      </dd>
    </div>
  );
}
