import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Repeat, CalendarDays, Users as UsersIcon, Clock3, Pencil, Trash2 } from "lucide-react";
import type { Role, RoutineJob, Unit } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/routines")({
  component: RoutinesPage,
});

const ROLE_OPTIONS: { role: Role; label: string }[] = [
  { role: "supervisor", label: "Supervisors" },
  { role: "senior_officer", label: "Senior Officers" },
  { role: "junior_officer", label: "Junior Officers" },
];

function RoutinesPage() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const routines = useStore((s) => s.routines);
  const toggle = useStore((s) => s.toggleRoutineCheckIn);
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const canManage = user.role === "director" || user.role.endsWith("manager");

  const baseRoutines = useMemo(
    () =>
      routines.filter(
        (r) =>
          (user.role === "director" || r.unit === "both" || r.unit === user.unit) &&
          (canManage || r.assignedRoleScope.includes(user.role)),
      ),
    [routines, user, canManage],
  );

  // Filters
  const [fUnit, setFUnit] = useState<"all" | Unit>("all");
  const [fCadence, setFCadence] = useState<"all" | "daily" | "weekly">("all");
  const [fOwner, setFOwner] = useState<string>("all");
  const [fQuery, setFQuery] = useState("");

  const ownerOptions = useMemo(() => {
    const ids = new Set<string>();
    baseRoutines.forEach((r) => Object.keys(r.checkIns).forEach((id) => ids.add(id)));
    users.forEach((u) => baseRoutines.forEach((r) => { if (r.assignedRoleScope.includes(u.role) && (r.unit === "both" || r.unit === u.unit)) ids.add(u.id); }));
    return users.filter((u) => ids.has(u.id));
  }, [baseRoutines, users]);

  const visibleRoutines = useMemo(() => {
    return baseRoutines.filter((r) => {
      if (fUnit !== "all" && r.unit !== fUnit) return false;
      if (fCadence !== "all" && r.cadence !== fCadence) return false;
      if (fOwner !== "all") {
        const assigned = users.find((u) => u.id === fOwner);
        if (!assigned) return false;
        if (!r.assignedRoleScope.includes(assigned.role)) return false;
        if (r.unit !== "both" && r.unit !== assigned.unit) return false;
      }
      const q = fQuery.trim().toLowerCase();
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [baseRoutines, fUnit, fCadence, fOwner, fQuery, users]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Routine Check-ups</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage ? "Create recurring jobs. Each cycle, they auto-inject into your team's accounts." : "Check off your daily and weekly recurring work."}
          </p>
        </div>
        {canManage && <CreateRoutineDialog />}
      </div>

      <Card>
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
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Cadence</Label>
            <Select value={fCadence} onValueChange={(v) => setFCadence(v as typeof fCadence)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
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
        </CardContent>
      </Card>

      {!canManage && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">My check-ins for today</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {visibleRoutines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No routines assigned to you.</p>
            ) : (
              visibleRoutines.map((r) => {
                const done = (r.checkIns[user.id] ?? []).includes(today);
                return (
                  <label key={r.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 hover:bg-muted/40">
                    <Checkbox checked={done} onCheckedChange={() => { toggle(r.id, user.id, today); toast.success(done ? "Marked incomplete" : "Checked in"); }} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{r.title}</span>
                        <Badge variant="outline" className="text-[10px]">{r.cadence}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </label>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleRoutines.map((r) => {
          const assignedUsers = users.filter(
            (u) => r.assignedRoleScope.includes(u.role) && (r.unit === "both" || r.unit === u.unit),
          );
          const completed = assignedUsers.filter((u) => (r.checkIns[u.id] ?? []).includes(today)).length;
          const rate = assignedUsers.length ? Math.round((completed / assignedUsers.length) * 100) : 0;
          return (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Repeat className="h-4 w-4 text-primary" />{r.title}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant={r.cadence === "daily" ? "default" : "secondary"}>{r.cadence}</Badge>
                    {canManage && <EditRoutineDialog routine={r} />}
                    {user.role === "director" && <DeleteRoutineButton routineId={r.id} title={r.title} />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" />{assignedUsers.length} assignees</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{r.unit === "both" ? "All units" : r.unit === "bd" ? "Business Dev" : "Marketing"}</span>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-foreground">Today's completion</span>
                    <span className="text-muted-foreground">{completed}/{assignedUsers.length} · {rate}%</span>
                  </div>
                  <Progress value={rate} className="h-2" />
                </div>
                <div className="space-y-1.5">
                  {assignedUsers.slice(0, 6).map((u) => {
                    const checked = (r.checkIns[u.id] ?? []).includes(today);
                    return (
                      <div key={u.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted/40">
                        <span className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${checked ? "bg-success" : "bg-muted-foreground/40"}`} />
                          <span className="text-foreground">{u.name}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {checked ? <span className="text-success">Checked in</span> : <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />Pending</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CreateRoutineDialog() {
  const user = useCurrentUser()!;
  const create = useStore((s) => s.createRoutine);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; cadence: "daily" | "weekly"; unit: Unit; roles: Role[] }>({
    title: "", description: "", cadence: "daily", unit: user.unit, roles: ["senior_officer", "junior_officer"],
  });

  const submit = () => {
    if (!form.title.trim() || form.roles.length === 0) { toast.error("Title and at least one role are required"); return; }
    create({
      title: form.title.trim(), description: form.description.trim(),
      cadence: form.cadence, unit: form.unit,
      assignedRoleScope: form.roles, createdBy: user.id,
    });
    toast.success("Routine job created");
    setOpen(false);
    setForm({ ...form, title: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />New routine</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create routine job</DialogTitle>
          <DialogDescription>It will auto-inject into target users' accounts each cycle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={400} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cadence</Label>
              <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v as "daily" | "weekly" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as Unit })} disabled={user.role !== "director"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(user.role === "director" || user.unit === "marketing") && <SelectItem value="marketing">Marketing</SelectItem>}
                  {(user.role === "director" || user.unit === "bd") && <SelectItem value="bd">Business Dev</SelectItem>}
                  {user.role === "director" && <SelectItem value="both">Both</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Target roles</Label>
            <ToggleGroup type="multiple" value={form.roles} onValueChange={(v) => setForm({ ...form, roles: v as Role[] })} className="flex-wrap justify-start">
              {ROLE_OPTIONS.map((r) => (
                <ToggleGroupItem key={r.role} value={r.role} className="text-xs">{r.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRoutineDialog({ routine }: { routine: RoutineJob }) {
  const user = useCurrentUser()!;
  const update = useStore((s) => s.updateRoutine);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; cadence: "daily" | "weekly"; unit: Unit; roles: Role[] }>({
    title: routine.title, description: routine.description, cadence: routine.cadence, unit: routine.unit, roles: routine.assignedRoleScope,
  });

  const submit = () => {
    if (!form.title.trim() || form.roles.length === 0) { toast.error("Title and at least one role are required"); return; }
    update(routine.id, {
      title: form.title.trim(), description: form.description.trim(),
      cadence: form.cadence, unit: form.unit, assignedRoleScope: form.roles,
    });
    toast.success("Routine updated");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit routine</DialogTitle>
          <DialogDescription>Update title, cadence, unit, or target roles.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={400} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cadence</Label>
              <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v as "daily" | "weekly" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as Unit })} disabled={user.role !== "director"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(user.role === "director" || user.unit === "marketing") && <SelectItem value="marketing">Marketing</SelectItem>}
                  {(user.role === "director" || user.unit === "bd") && <SelectItem value="bd">Business Dev</SelectItem>}
                  {user.role === "director" && <SelectItem value="both">Both</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Target roles</Label>
            <ToggleGroup type="multiple" value={form.roles} onValueChange={(v) => setForm({ ...form, roles: v as Role[] })} className="flex-wrap justify-start">
              {ROLE_OPTIONS.map((r) => (
                <ToggleGroupItem key={r.role} value={r.role} className="text-xs">{r.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
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

function DeleteRoutineButton({ routineId, title }: { routineId: string; title: string }) {
  const remove = useStore((s) => s.deleteRoutine);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete routine?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently remove "{title}" and all of its check-in history.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { remove(routineId); toast.success("Routine deleted"); }}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
