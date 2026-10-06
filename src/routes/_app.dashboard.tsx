import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore, getVisibleUserIds } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, TrendingUp, Users } from "lucide-react";
import type { Unit } from "@/lib/types";

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
  const [unitFilter, setUnitFilter] = useState<Unit>(user?.unit ?? "all");

  if (!user) return null;

  const visibleIds = useMemo(() => getVisibleUserIds(user, users), [user, users]);

  const scopedUsers = useMemo(() => {
    let list = users.filter((u) => visibleIds.includes(u.id));
    if (user.role === "director" && unitFilter !== "all") {
      list = list.filter((u) => u.unit === unitFilter || u.unit === "all");
    }
    return list;
  }, [users, visibleIds, user, unitFilter]);

  const scopedTasks = useMemo(
    () => tasks.filter((t) => scopedUsers.some((u) => u.id === t.assignedTo || u.id === t.createdBy)),
    [tasks, scopedUsers],
  );

  const counts = useMemo(() => {
    const c = { todo: 0, in_progress: 0, awaiting_approval: 0, done: 0 };
    scopedTasks.forEach((t) => {
      c[t.status]++;
    });
    return c;
  }, [scopedTasks]);

  const chartData = useMemo(() => {
    const data: Record<string, number> = { todo: 0, in_progress: 0, awaiting_approval: 0, done: 0 };
    scopedTasks.forEach((t) => {
      data[t.status]++;
    });
    return [
      { name: "To Do", value: data.todo, fill: STATUS_COLORS.todo },
      { name: "In Progress", value: data.in_progress, fill: STATUS_COLORS.in_progress },
      { name: "Awaiting Approval", value: data.awaiting_approval, fill: STATUS_COLORS.awaiting_approval },
      { name: "Done", value: data.done, fill: STATUS_COLORS.done },
    ];
  }, [scopedTasks]);

  const timelineData = useMemo(() => {
    const weeks: Record<string, number> = {};
    scopedTasks.forEach((t) => {
      const week = new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      weeks[week] = (weeks[week] ?? 0) + 1;
    });
    return Object.entries(weeks).map(([week, count]) => ({ week, tasks: count }));
  }, [scopedTasks]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome, {user.name}. Here's your overview.</p>
      </div>

      {user.role === "director" && (
        <div className="flex items-center gap-3">
          <Tabs value={unitFilter} onValueChange={(v) => setUnitFilter(v as Unit)}>
            <TabsList>
              <TabsTrigger value="all">All Units</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="bd">Business Dev</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">To Do</p>
                <p className="text-2xl font-bold">{counts.todo}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{counts.in_progress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Awaiting Approval</p>
                <p className="text-2xl font-bold">{counts.awaiting_approval}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{counts.done}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Due Date</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total team members</span>
            </div>
            <span className="font-semibold">{scopedUsers.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active routines</span>
            </div>
            <span className="font-semibold">{routines.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
