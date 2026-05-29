import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Calendar, Send, Trash2 } from "lucide-react";
import type { ExternalRequest, ExternalRequestStatus, ExternalDepartment } from "@/lib/types";
import { EXTERNAL_DEPARTMENTS, EXTERNAL_DEPARTMENT_LABELS } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/external-requests")({
  component: ExternalRequestsPage,
});

const EXT_STATUS_META: Record<ExternalRequestStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  acknowledged: { label: "Acknowledged", cls: "bg-chart-3/15 text-chart-3" },
  fulfilled: { label: "Fulfilled", cls: "bg-success/15 text-success" },
  declined: { label: "Declined", cls: "bg-destructive/15 text-destructive" },
};

function ExternalRequestsPage() {
  const user = useCurrentUser();
  const requests = useStore((s) => s.externalRequests);
  const [filter, setFilter] = useState<ExternalRequestStatus | "all">("all");
  const [fDept, setFDept] = useState<ExternalDepartment | "all">("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fQuery, setFQuery] = useState("");
  if (!user) return null;

  const visible = useMemo(() => {
    let list = user.role === "director" ? requests : requests.filter((r) => r.requestedBy === user.id || user.role.endsWith("manager"));
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (fDept !== "all") list = list.filter((r) => r.department === fDept);
    if (fFrom) list = list.filter((r) => r.requestedDate >= fFrom);
    if (fTo) list = list.filter((r) => r.requestedDate <= fTo);
    const q = fQuery.trim().toLowerCase();
    if (q) list = list.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    return list;
  }, [requests, filter, fDept, fFrom, fTo, fQuery, user]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">External Requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track requests sent to other departments (Supply, Finance, HR, CEO Office…).</p>
        </div>
        <CreateExternalRequestDialog />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Search</Label>
            <Input value={fQuery} onChange={(e) => setFQuery(e.target.value)} placeholder="Title or description…" className="h-9 w-52" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Department</Label>
            <Select value={fDept} onValueChange={(v) => setFDept(v as typeof fDept)}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {EXTERNAL_DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{EXTERNAL_DEPARTMENT_LABELS[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Requested from</Label>
            <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Requested to</Label>
            <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "acknowledged", "fulfilled", "declined"] as const).map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s as typeof filter)}>
            {s === "all" ? "All" : EXT_STATUS_META[s].label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No external requests match your filters.</p>
          </CardContent></Card>
        ) : (
          visible.map((r) => <ExternalRequestRow key={r.id} req={r} />)
        )}
      </div>
    </div>
  );
}

function ExternalRequestRow({ req }: { req: ExternalRequest }) {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const setStatus = useStore((s) => s.setExternalRequestStatus);
  const remove = useStore((s) => s.deleteExternalRequest);
  const requester = users.find((u) => u.id === req.requestedBy);
  const meta = EXT_STATUS_META[req.status];
  const overdue = req.status !== "fulfilled" && req.status !== "declined" && req.dueDate < new Date().toISOString().slice(0, 10);
  const canManage = user.role === "director" || req.requestedBy === user.id || user.role.endsWith("manager");

  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{req.title}</h3>
            <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
              <Building2 className="mr-1 h-3 w-3" />{EXTERNAL_DEPARTMENT_LABELS[req.department]}
            </Badge>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}>{meta.label}</span>
            {overdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{req.description}</p>
          {req.responseNote && (
            <div className="mt-2 rounded-md border bg-muted/40 p-2 text-xs">
              <strong>Response:</strong> {req.responseNote}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Requested by: <strong className="text-foreground">{requester?.name}</strong></span>
            {req.contactPerson && <span>Contact: {req.contactPerson}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Sent {req.requestedDate}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Needed by {req.dueDate}</span>
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Select value={req.status} onValueChange={(v) => { setStatus(req.id, v as ExternalRequestStatus); toast.success("Status updated"); }}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["pending", "acknowledged", "fulfilled", "declined"] as ExternalRequestStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{EXT_STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user.role === "director" && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => { remove(req.id); toast.success("Request removed"); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateExternalRequestDialog() {
  const create = useStore((s) => s.createExternalRequest);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", department: "supply_facility" as ExternalDepartment,
    contactPerson: "", dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  const submit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    create({
      title: form.title.trim(),
      description: form.description.trim(),
      department: form.department,
      contactPerson: form.contactPerson.trim() || undefined,
      dueDate: form.dueDate,
    });
    toast.success("Request sent");
    setOpen(false);
    setForm({ ...form, title: "", description: "", contactPerson: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Send className="mr-1 h-4 w-4" />New external request</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request from another department</DialogTitle>
          <DialogDescription>Log a request sent to another business unit and track its status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
          <div className="space-y-1.5"><Label>Department</Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v as ExternalDepartment })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXTERNAL_DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{EXTERNAL_DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Contact person (optional)</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} /></div>
          <div className="space-y-1.5"><Label>Needed by</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
