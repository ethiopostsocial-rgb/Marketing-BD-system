import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore, getVisibleUserIds } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, TrendingUp, Users, Heart, Handshake, ShoppingCart, Mail, Server, Stamp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, Unit } from "@/lib/types";
import { UNIT_LABELS } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

const STATUS_COLORS: Record<string, string> = {
  todo: "var(--muted-foreground)",
  in_progress: "var(--chart-3)",
  awaiting_approval: "var(--accent)",
  done: "var(--success)",
};

const UNIT_ICONS: Record<string, typeof Heart> = {
  branding_communication: Heart,
  partnership: Handshake,
  ecommerce: ShoppingCart,
  mail_service: Mail,
  vps_government: Server,
  philately_museum: Stamp,
};

const UNIT_ROUTES: Record<string, string> = {
  branding_communication: "/units/branding-communication",
  partnership: "/units/partnership",
  ecommerce: "/units/ecommerce",
  mail_service: "/units/mail-service",
  vps_government: "/units/vps-government",
  philately_museum: "/units/philately-museum",
};

function DashboardPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  const routines = useStore((s) => s.routines);
  const [unitFilter, setUnitFilter] = useState<Unit>(user?.unit ?? "all");

  if (!user) return null;

  const visibleIds = useMemo(() => getVisibleUserIds(user, users), [user, users]);

  const scopedUsers = useMemo(() => {
    let list = users.filter((u) => visibleIds.includes(u.id));
    if (user.role === "director" && unitFilter !== "all") list = list.filter((u) => u.unit === unitFilter || u.unit === "all");
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

  const chartData = useMemo(() => {
    const data: Record<string, number> = { todo: 0, in_progress: 0, awaiting_approval: 0, done: 0 };
    scopedTasks.forEach((t) => { data[t.status]++; });
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

  const units = ["branding_communication", "partnership", "ecommerce", "mail_service", "vps_government", "philately_museum"] as const;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome, {user.name}. Here's your overview.</p>
      </div>

      {/* UNITS GRID - Only show for directors and new unit assignments */}
      {(user.unit === "all" || units.includes(user.unit as any)) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Units</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {units.map((unitKey) => {
              if (user.unit !== "all" && user.unit !== unitKey) return null;
              const Icon = UNIT_ICONS[unitKey];
              const unitTasks = tasks.filter((t) => users.find((u) => u.id === t.assignedTo && u.unit === unitKey));
              const completedCount = unitTasks.filter((t) => t.status === "done").length;
              return (
                <Card key={unitKey} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate({ to: UNIT_ROUTES[unitKey] })}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground font-medium">Unit</div>
                        <h3 className="mt-1 text-sm font-semibold line-clamp-2">{UNIT_LABELS[unitKey]}</h3>
                      </div>
                      {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tasks</span>
                        <span className="font-semibold">{unitTasks.length}</span>
                      </div>
                      {unitTasks.length > 0 && (
                        <>
                          <Progress value={(completedCount / unitTasks.length) * 100} className="h-1.5" />
                          <div className="text-[10px] text-muted-foreground">{completedCount} of {unitTasks.length} done</div>
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs p-1">
                      View <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs for filtering */}
      {user.role === "director" && (
        <div className="flex items-center gap-3">
          <Tabs value={unitFilter} onValueChange={(v) => setUnitFilter(v as Unit)}>
            <TabsList>
              <TabsTrigger value="all">All Units</TabsTrigger>
              <TabsTrigger value="branding_communication">Branding</TabsTrigger>
              <TabsTrigger value="partnership">Partnership</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Stats Cards */}
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

      {/* Charts */}
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

      {/* Team Overview */}
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
