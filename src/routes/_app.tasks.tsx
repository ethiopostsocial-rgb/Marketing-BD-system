import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore, getVisibleUserIds, canAssignTo, canApproveTask, isTaskOwner, getTaskAssignees } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Paperclip, CheckCircle2, XCircle, ArrowRight, Sparkles, Calendar, User as UserIcon, Pencil, Trash2, Download, LayoutGrid, List as ListIcon } from "lucide-react";
import type { Task, TaskStatus, User } from "@/lib/types";
import { EXTERNAL_DEPARTMENT_LABELS } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

const STATUS_META: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: "To Do", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", cls: "bg-chart-3/15 text-chart-3" },
  awaiting_approval: { label: "Awaiting Approval", cls: "bg-accent/20 text-accent-foreground border border-accent/40" },
  done: { label: "Done", cls: "bg-success/15 text-success" },
};


function TasksPage() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  if (!user) return null;

  const visibleIds = useMemo(() => getVisibleUserIds(user, users), [user, users]);
  const visible = useMemo(
    () => tasks.filter((t) => {
      const owners = getTaskAssignees(t);
      return owners.some((id) => visibleIds.includes(id)) || visibleIds.includes(t.createdBy) || t.createdBy === user.id;
    }),
    [tasks, visibleIds, user.id],
  );

  const [tab, setTab] = useState<TaskStatus | "all">("all");
  const [view, setView] = useState<"list" | "board">("list");

  // Filters
  const [fUnit, setFUnit] = useState<"all" | "marketing" | "bd" | "both">("all");
  const [fOwner, setFOwner] = useState<string>("all");
  const [fFrom, setFFrom] = useState<string>("");
  const [fTo, setFTo] = useState<string>("");
  const [fQuery, setFQuery] = useState("");

  const ownerOptions = useMemo(() => users.filter((u) => visibleIds.includes(u.id)), [users, visibleIds]);

  const filtered = useMemo(() => {
    return visible.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      const owners = getTaskAssignees(t);
      if (fOwner !== "all" && !owners.includes(fOwner)) return false;
      if (fUnit !== "all") {
        const ok = owners.some((id) => {
          const a = users.find((u) => u.id === id);
          return a && (a.unit === fUnit || a.unit === "both");
        });
        if (!ok) return false;
      }
      if (fFrom && t.dueDate < fFrom) return false;
      if (fTo && t.startDate > fTo) return false;
      const q = fQuery.trim().toLowerCase();
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [visible, tab, fOwner, fUnit, fFrom, fTo, fQuery, users]);

  const resetFilters = () => { setFUnit("all"); setFOwner("all"); setFFrom(""); setFTo(""); setFQuery(""); };
  const activeFilterCount = [fUnit !== "all", fOwner !== "all", !!fFrom, !!fTo, !!fQuery.trim()].filter(Boolean).length;

  const buckets: TaskStatus[] = ["todo", "in_progress", "awaiting_approval", "done"];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage internal work assigned across your team.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportReportDialog />
          <CreateTaskDialog />
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Search</Label>
            <Input value={fQuery} onChange={(e) => setFQuery(e.target.value)} placeholder="Title or description…" className="h-9 w-52" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Unit</Label>
            <Select value={fUnit} onValueChange={(v) => setFUnit(v as typeof fUnit)}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="bd">Business Dev</SelectItem>
                <SelectItem value="both">Cross-unit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Owner</Label>
            <Select value={fOwner} onValueChange={setFOwner}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {ownerOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Due from</Label>
            <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Start to</Label>
            <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="h-9 w-40" />
          </div>
          {activeFilterCount > 0 && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>Clear ({activeFilterCount})</Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All <Badge variant="secondary" className="ml-2">{visible.length}</Badge></TabsTrigger>
            {buckets.map((b) => (
              <TabsTrigger key={b} value={b}>
                {STATUS_META[b].label}
                <Badge variant="secondary" className="ml-2">{visible.filter((t) => t.status === b).length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="inline-flex overflow-hidden rounded-md border">
            <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="h-8 rounded-none" onClick={() => setView("list")}>
              <ListIcon className="mr-1 h-3.5 w-3.5" />List
            </Button>
            <Button size="sm" variant={view === "board" ? "default" : "ghost"} className="h-8 rounded-none" onClick={() => setView("board")}>
              <LayoutGrid className="mr-1 h-3.5 w-3.5" />Board
            </Button>
          </div>
        </div>
        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
            </CardContent></Card>
          ) : view === "list" ? (
            <div className="space-y-3">{filtered.map((t) => <TaskRow key={t.id} task={t} />)}</div>
          ) : (
            <KanbanBoard tasks={filtered} users={users} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KanbanBoard({ tasks, users }: { tasks: Task[]; users: User[] }) {
  const cols: { key: TaskStatus; label: string }[] = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "awaiting_approval", label: "Awaiting Approval" },
    { key: "done", label: "Done" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cols.map((c) => {
        const items = tasks.filter((t) => t.status === c.key);
        return (
          <div key={c.key} className="rounded-lg border bg-muted/30 p-2">
            <div className="mb-2 flex items-center justify-between px-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</h3>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="px-1.5 py-6 text-center text-xs text-muted-foreground">No tasks</p>
              ) : (
                items.map((t) => <KanbanCard key={t.id} task={t} users={users} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task, users }: { task: Task; users: User[] }) {
  const meta = STATUS_META[task.status];
  const overdue = task.status !== "done" && task.dueDate < new Date().toISOString().slice(0, 10);
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
          {overdue && <Badge variant="destructive" className="shrink-0 text-[10px]">Late</Badge>}
        </div>
        {task.description && <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />{task.dueDate}
          </span>
          <OwnerAvatars task={task} users={users} size="sm" />
        </div>
        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${meta.cls}`}>{meta.label}</span>
      </CardContent>
    </Card>
  );
}

function OwnerAvatars({ task, users, size = "md" }: { task: Task; users: User[]; size?: "sm" | "md" }) {
  const owners = getTaskAssignees(task)
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => !!u);
  const dim = size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[10px]";
  return (
    <div className="flex items-center -space-x-1.5">
      {owners.slice(0, 4).map((u) => (
        <div
          key={u.id}
          title={`${u.name} — ${u.title}`}
          className={`flex ${dim} items-center justify-center rounded-full border-2 border-background font-semibold text-white`}
          style={{ background: u.avatarColor }}
        >
          {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
        </div>
      ))}
      {owners.length > 4 && (
        <div className={`flex ${dim} items-center justify-center rounded-full border-2 border-background bg-muted font-semibold`}>
          +{owners.length - 4}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const updateStatus = useStore((s) => s.updateTaskStatus);
  const approve = useStore((s) => s.approveTask);
  const reject = useStore((s) => s.rejectTask);

  const owners = getTaskAssignees(task).map((id) => users.find((u) => u.id === id)).filter((u): u is User => !!u);
  const primary = users.find((u) => u.id === task.assignedTo);
  const creator = users.find((u) => u.id === task.createdBy);
  const meta = STATUS_META[task.status];

  const isAssignee = isTaskOwner(user.id, task);
  const canApprove = task.status === "awaiting_approval" && canApproveTask(user, task, users);
  const overdue = task.status !== "done" && task.dueDate < new Date().toISOString().slice(0, 10);
  const canUpdateStatus = isAssignee && task.status !== "done" && task.status !== "awaiting_approval";
  const lineManager = users.find((u) => u.id === primary?.managerId);

  const [open, setOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const advance = () => {
    const next: Record<TaskStatus, TaskStatus | null> = {
      todo: "in_progress",
      in_progress: "awaiting_approval",
      awaiting_approval: null,
      done: null,
    };
    const n = next[task.status];
    if (!n) return;
    updateStatus(task.id, n);
    toast.success(n === "awaiting_approval" ? "Submitted for approval" : "Status updated");
  };

  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}>{meta.label}</span>
            {task.crossFunctional && (
              <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary"><Sparkles className="mr-1 h-3 w-3" />Cross-functional</Badge>
            )}
            {owners.length > 1 && (
              <Badge variant="outline" className="border-chart-3/40 bg-chart-3/10 text-chart-3">{owners.length} owners</Badge>
            )}
            {overdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          {task.rejectionReason && (
            <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <strong>Rejected:</strong> {task.rejectionReason}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">By: {creator?.name}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Due {task.dueDate}</span>
            {task.attachment && <span className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />{task.attachment}</span>}
          </div>
          {/* Owners footer */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Owner{owners.length > 1 ? "s" : ""}:</span>
            <OwnerAvatars task={task} users={users} />
            <span className="text-xs text-foreground">{owners.map((u) => u.name).join(", ")}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {(user.role === "director" || task.createdBy === user.id || canApproveTask(user, task, users) || (user.role.endsWith("manager"))) && (
            <EditTaskDialog task={task} />
          )}
          {user.role === "director" && <DeleteTaskButton id={task.id} title={task.title} />}
          {canUpdateStatus && (
            <Button size="sm" variant="outline" onClick={advance}>
              {task.status === "todo" ? "Start" : `Submit to ${lineManager?.name ?? "line manager"}`} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          {task.status === "awaiting_approval" && (
            <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent-foreground">
              Awaiting {lineManager?.name ?? "line manager"}
            </Badge>
          )}
          {canApprove && (
            <>
              <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => { approve(task.id); toast.success("Task approved"); }}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><XCircle className="mr-1 h-3.5 w-3.5" />Reject</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject task</DialogTitle>
                    <DialogDescription>Provide a reason. The task returns to In Progress.</DialogDescription>
                  </DialogHeader>
                  <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="What needs to be revised?" rows={4} />
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="destructive" disabled={!rejectReason.trim()}
                      onClick={() => { reject(task.id, rejectReason.trim()); setOpen(false); setRejectReason(""); toast.success("Sent back for revision"); }}>
                      Send back
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTaskDialog() {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const createTask = useStore((s) => s.createTask);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    attachment: "",
  });
  const [assignees, setAssignees] = useState<string[]>([user.id]);

  const assignableUsers = useMemo(
    () => users.filter((u) => canAssignTo(user, u, users)),
    [users, user],
  );

  const toggle = (id: string) =>
    setAssignees((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const submit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (assignees.length === 0) { toast.error("Select at least one assignee"); return; }
    if (form.dueDate < form.startDate) { toast.error("Due date must be after start date"); return; }
    const crossFunctional = assignees.some((aid) => {
      const a = users.find((u) => u.id === aid)!;
      return a.unit !== user.unit && user.unit !== "both" && a.unit !== "both";
    });
    createTask({
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: form.startDate,
      dueDate: form.dueDate,
      status: "todo",
      attachment: form.attachment || null,
      createdBy: user.id,
      assignedTo: assignees[0],
      assignees,
      crossFunctional,
    });
    toast.success(assignees.length > 1 ? `Task created with ${assignees.length} owners` : "Task created");
    setOpen(false);
    setForm({ ...form, title: "", description: "", attachment: "" });
    setAssignees([user.id]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" />New task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Select one or many owners — they share a single task and all can update its status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short, action-oriented title" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to ({assignees.length} selected)</Label>
            <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-md border p-2">
              {assignableUsers.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-muted">
                  <Checkbox checked={assignees.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
                  <span className="text-sm">{u.name} {u.id === user.id && "(myself)"} — <span className="text-muted-foreground">{u.title}</span></span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{assignableUsers.length} eligible recipient(s) based on your role.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Attachment</Label>
            <Input type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0]?.name ?? "" })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create task{assignees.length > 1 ? ` (${assignees.length} owners)` : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({ task }: { task: Task }) {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const update = useStore((s) => s.updateTask);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assignedTo: task.assignedTo,
  });

  const assignableUsers = useMemo(
    () => users.filter((u) => canAssignTo(user, u, users) || u.id === task.assignedTo),
    [users, user, task.assignedTo],
  );

  const submit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (form.dueDate < form.startDate) { toast.error("Due date must be after start date"); return; }
    const assignee = users.find((u) => u.id === form.assignedTo)!;
    const crossFunctional = assignee.unit !== user.unit && user.unit !== "both" && assignee.unit !== "both";
    update(task.id, {
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: form.startDate,
      dueDate: form.dueDate,
      assignedTo: form.assignedTo,
      crossFunctional,
    });
    toast.success("Task updated");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Adjust details, dates, or reassign.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Due date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Assigned to</Label>
            <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {assignableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} — {u.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTaskButton({ id, title }: { id: string; title: string }) {
  const remove = useStore((s) => s.deleteTask);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>"{title}" will be permanently removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { remove(id); toast.success("Task deleted"); }}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ====================== Export performance report ======================


function ExportReportDialog() {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  const externals = useStore((s) => s.externalRequests);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const visibleIds = useMemo(() => getVisibleUserIds(user, users), [user, users]);

  const handleExport = () => {
    if (from > to) { toast.error("From date must be before To date"); return; }
    const inRange = (d: string) => d >= from && d <= to;
    const scopedTasks = tasks.filter((t) => visibleIds.includes(t.assignedTo) && inRange(t.startDate));

    const rows: string[][] = [
      ["Performance Report"],
      [`Period: ${from} to ${to}`],
      [`Generated by: ${user.name} (${user.title})`],
      [],
      ["User", "Title", "Unit", "Assigned", "Done", "In Progress", "Awaiting Approval", "To Do", "Overdue", "On-time completion %"],
    ];
    visibleIds.forEach((uid) => {
      const u = users.find((x) => x.id === uid);
      if (!u) return;
      const mine = scopedTasks.filter((t) => t.assignedTo === uid);
      if (mine.length === 0) return;
      const done = mine.filter((t) => t.status === "done");
      const inProg = mine.filter((t) => t.status === "in_progress").length;
      const awaiting = mine.filter((t) => t.status === "awaiting_approval").length;
      const todo = mine.filter((t) => t.status === "todo").length;
      const overdue = mine.filter((t) => t.status !== "done" && t.dueDate < today).length;
      const onTime = done.filter((t) => t.dueDate >= t.startDate).length;
      const rate = done.length > 0 ? `${Math.round((onTime / done.length) * 100)}%` : "—";
      rows.push([u.name, u.title, u.unit, String(mine.length), String(done.length), String(inProg), String(awaiting), String(todo), String(overdue), rate]);
    });
    rows.push([], ["External Requests in period"], ["Title", "Department", "Requested by", "Requested", "Due", "Status"]);
    externals.filter((r) => inRange(r.requestedDate)).forEach((r) => {
      const reqUser = users.find((u) => u.id === r.requestedBy);
      rows.push([r.title, EXTERNAL_DEPARTMENT_LABELS[r.department], reqUser?.name ?? "—", r.requestedDate, r.dueDate, r.status]);
    });

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Download className="mr-1 h-4 w-4" />Export report</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export performance report</DialogTitle>
          <DialogDescription>Pick a date range. The CSV covers your visible team's tasks and external requests.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "Last 90 days", days: 90 },
            { label: "Year to date", days: -1 },
          ].map((p) => (
            <Button key={p.label} size="sm" variant="ghost" onClick={() => {
              setTo(today);
              if (p.days === -1) setFrom(`${new Date().getFullYear()}-01-01`);
              else setFrom(new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10));
            }}>{p.label}</Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleExport}><Download className="mr-1 h-4 w-4" />Download CSV</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
