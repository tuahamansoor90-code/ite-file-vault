import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserMinus,
  Briefcase,
  Wallet,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEmployeeStore, type Employee } from "@/lib/employee-store";

function money(n: number) {
  if (!Number.isFinite(n) || n === 0) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

function isThisMonth(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function groupCount<T extends string>(arr: Employee[], key: (e: Employee) => T | "" | undefined) {
  const map = new Map<string, number>();
  for (const e of arr) {
    const k = (key(e) || "").toString().trim();
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export function EmployeeAnalyticsPanel() {
  const { employees, hydrated } = useEmployeeStore();

  const data = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.jobStatus === "Active").length;
    const onLeave = employees.filter((e) => e.jobStatus === "On Leave").length;
    const resigned = employees.filter((e) => e.jobStatus === "Resigned").length;
    const terminated = employees.filter((e) => e.jobStatus === "Terminated").length;

    const payroll = employees
      .filter((e) => e.jobStatus === "Active")
      .reduce((sum, e) => sum + (parseFloat(e.netPayable) || 0), 0);

    const trainingNeeded = employees.filter((e) => e.trainingRequired === "Yes").length;
    const newJoiners = employees.filter((e) => isThisMonth(e.joiningDate)).length;

    const ratings = employees
      .map((e) => parseFloat(e.performanceRating))
      .filter((n) => Number.isFinite(n));
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const byDept = groupCount(employees, (e) => e.department);
    const byEmployment = groupCount(employees, (e) => e.employmentStatus);
    const byGender = groupCount(employees, (e) => e.gender);
    const byAi = groupCount(employees, (e) => e.aiLiteracy);

    return {
      total,
      active,
      onLeave,
      resigned,
      terminated,
      payroll,
      trainingNeeded,
      newJoiners,
      avgRating,
      byDept,
      byEmployment,
      byGender,
      byAi,
    };
  }, [employees]);

  if (!hydrated) return null;
  if (data.total === 0) return null;

  const cards = [
    {
      label: "Total employees",
      value: data.total,
      icon: Users,
      tone: "text-primary bg-primary-soft",
      sub: `${data.active} active`,
    },
    {
      label: "On leave",
      value: data.onLeave,
      icon: UserCheck,
      tone: "text-warning bg-warning/10",
      sub: `${data.newJoiners} new this month`,
    },
    {
      label: "Resigned / Terminated",
      value: data.resigned + data.terminated,
      icon: UserMinus,
      tone: "text-destructive bg-destructive/10",
      sub: `${data.resigned} resigned · ${data.terminated} terminated`,
    },
    {
      label: "Monthly payroll",
      value: money(data.payroll),
      icon: Wallet,
      tone: "text-success bg-success/10",
      sub: "active staff net payable",
    },
    {
      label: "Training required",
      value: data.trainingNeeded,
      icon: GraduationCap,
      tone: "text-primary bg-primary-soft",
      sub: "flagged for upskilling",
    },
    {
      label: "Avg performance",
      value: data.avgRating ? data.avgRating.toFixed(2) : "—",
      icon: TrendingUp,
      tone: "text-success bg-success/10",
      sub: "rating across staff",
    },
  ];

  const maxDept = data.byDept[0]?.[1] ?? 1;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Employee analytics</h2>
        </div>
        <span className="text-xs text-muted-foreground">HR overview</span>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 border-t p-5 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">By department</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {data.byDept.length} {data.byDept.length === 1 ? "dept" : "depts"}
            </span>
          </div>
          {data.byDept.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
              No department data yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.byDept.slice(0, 6).map(([name, count], i) => (
                <motion.li
                  key={name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-lg border bg-surface p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs font-semibold text-primary">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxDept) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <SplitBlock title="Employment status" items={data.byEmployment} />
          <SplitBlock title="Gender" items={data.byGender} />
          <SplitBlock title="AI literacy" items={data.byAi} />
        </div>
      </div>
    </section>
  );
}

function SplitBlock({ title, items }: { title: string; items: [string, number][] }) {
  const total = items.reduce((sum, [, n]) => sum + n, 0);
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map(([name, count]) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <span
                key={name}
                className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs"
              >
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground">
                  {count} · {pct}%
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
