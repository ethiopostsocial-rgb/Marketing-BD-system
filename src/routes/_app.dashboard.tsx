import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore, getVisibleUserIds } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, TrendingUp, Users } from "lucide-react";
import type { Task, Unit } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const STATUS_COLORS: Record<string, string> = {
  todo: "var(--muted-foreground)",
  in_progress: "var(--chart-3)",
  awaiting_approval: "var(--accent)",
  done: "var(--success)",
};

function DashboardPage() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  const routines = useStore((s) => s.routines);
  const [unitFilter, setUnitFilter] = useState<Unit>(user?.unit ?? "both");

  if (!user) return null;

  const visibleIds = useMemo(() => getVisibleUserIds(user, users), [user, users]);

  const scopedUsers = useMemo(() => {
    let list = users.filter((u) => visibleIds.includes(u.id));
    if (user.role === "director" && unitFilter !== "both") list = list.filter((u) => u.unit === unitFilter || u.unit === "both");
    return list;
  }, [users, visibleIds, user, unitFilter]);

  const scopedTasks = useMemo(
    () => tasks.filter((t) => scopedUsers.some((u) => u.id === t.assignedTo || u.id === t.createdBy)),
    [tasks, scopedUsers],
  );

  const counts = useMemo(() => {
    const c = { todo: 0, in_progress: 0, awaiting_approval: 0, done: 0 };
    scopedTasks.forEach((t) => { c[t.status]++; });
    return c;
  }, [scopedTasks]);

  const overdue = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    return scopedTasks.filter((t) => t.status !== "done" && t.dueDate < now);
  }, [scopedTasks]);

  const completionRate = scopedTasks.length ? Math.round((counts.done / scopedTasks.length) * 100) : 0;

  // Routine performance
  const today = new Date().toISOString().slice(0, 10);
  const routinePerf = routines.map((r) => {
    const assignedUsers = scopedUsers.filter((u) => r.assignedRoleScope.includes(u.role) && (r.unit === "both" || r.unit === u.unit));
    if (!assignedUsers.length) return { name: r.title, rate: 0, completed: 0, total: 0 };
    const completed = assignedUsers.reduce((acc, u) => acc + ((r.checkIns[u.id] ?? []).includes(today) ? 1 : 0), 0);
    return { name: r.title, rate: Math.round((completed / assignedUsers.length) * 100), completed, total: assignedUsers.length };
  });

  // Per-person performance for bar chart
  const perPerson = scopedUsers
    .filter((u) => u.id !== user.id || scopedUsers.length === 1)
    .map((u) => {
      const userTasks = scopedTasks.filter((t) => t.assignedTo === u.id);
      const done = userTasks.filter((t) => t.status === "done").length;
      return {
        name: u.name.split(" ")[0],
        Done: done,
        Active: userTasks.filter((t) => t.status === "in_progress" || t.status === "todo").length,
        Pending: userTasks.filter((t) => t.status === "awaiting_approval").length,
      };
    })
    .slice(0, 8);

  // 7-day trend
  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    return days.map((d) => ({
      day: d.slice(5),
      Completed: scopedTasks.filter((t) => t.status === "done" && t.dueDate <= d).length,
      Created: scopedTasks.filter((t) => t.startDate <= d).length,
    }));
  }, [scopedTasks]);

  const pieData = [
    { name: "To Do", value: counts.todo, color: STATUS_COLORS.todo },
    { name: "In Progress", value: counts.in_progress, color: STATUS_COLORS.in_progress },
    { name: "Awaiting Approval", value: counts.awaiting_approval, color: STATUS_COLORS.awaiting_approval },
    { name: "Done", value: counts.done, color: STATUS_COLORS.done },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Good day, {user.name.split(" ")[0]}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "director"
              ? "Comprehensive performance across both units."
              : user.role.endsWith("manager")
              ? `Unit-wide performance — ${user.unit === "marketing" ? "Marketing" : "Business Development"}.`
              : user.role === "supervisor"
              ? "Your team's performance and outstanding work."
              : "Your individual performance overview."}
          </p>
        </div>
        {user.role === "director" && (
          <Tabs value={unitFilter} onValueChange={(v) => setUnitFilter(v as Unit)}>
            <TabsList>
              <TabsTrigger value="both">All Units</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="bd">Business Dev</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Team members" value={scopedUsers.length} icon={Users} accent="primary" />
        <KpiCard label="Active tasks" value={counts.todo + counts.in_progress} icon={ClipboardList} accent="chart" />
        <KpiCard label="Completion rate" value={`${completionRate}%`} icon={TrendingUp} accent="success" />
        <KpiCard label="Overdue" value={overdue.length} icon={AlertTriangle} accent={overdue.length ? "destructive" : "muted"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Performance trend (7 days)</CardTitle>
            <Badge variant="secondary" className="font-normal">Completed vs Created</Badge>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Completed" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Created" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Task status overview</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {pieData.length === 0 ? (
              <EmptyState label="No tasks in scope yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Per-person */}
        {perPerson.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">Team performance</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perPerson} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Done" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Active" stackId="a" fill="var(--chart-3)" />
                  <Bar dataKey="Pending" stackId="a" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Urgency hurdles */}
        <Card className={perPerson.length === 0 ? "lg:col-span-3" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Urgency hurdles
            </CardTitle>
            <Badge variant="destructive">{overdue.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {overdue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="mt-2 text-sm text-muted-foreground">No overdue items. Great work.</p>
              </div>
            ) : (
              overdue.slice(0, 5).map((t) => <OverdueRow key={t.id} task={t} users={users} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Routine performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Routine job performance — today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {routinePerf.length === 0 ? (
            <EmptyState label="No routine jobs in scope" />
          ) : (
            routinePerf.map((r, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.completed}/{r.total} checked in · {r.rate}%</span>
                </div>
                <Progress value={r.rate} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: "primary" | "chart" | "success" | "destructive" | "muted" }) {
  const colors: Record<string, string> = {
    primary: "var(--primary)",
    chart: "var(--chart-3)",
    success: "var(--success)",
    destructive: "var(--destructive)",
    muted: "var(--muted-foreground)",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in oklab, ${colors[accent]} 14%, transparent)`, color: colors[accent] }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold leading-tight text-foreground">{value}</div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverdueRow({ task, users }: { task: Task; users: { id: string; name: string }[] }) {
  const assignee = users.find((u) => u.id === task.assignedTo);
  const daysOver = Math.max(1, Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86400000));
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">Assigned to {assignee?.name ?? "—"}</div>
      </div>
      <Badge variant="destructive" className="shrink-0">{daysOver}d overdue</Badge>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div>;
}
