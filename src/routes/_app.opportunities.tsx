import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Calendar, Plus, Trash2, User as UserIcon } from "lucide-react";
import type { Proposal, ProposalStage } from "@/lib/types";
import { PROPOSAL_STAGES, PROPOSAL_STAGE_LABELS } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/opportunities")({
  component: OpportunitiesPage,
});

const STAGE_META: Record<ProposalStage, string> = {
  opportunity: "bg-muted text-muted-foreground",
  drafting: "bg-chart-3/15 text-chart-3",
  submitted: "bg-primary/15 text-primary",
  negotiation: "bg-chart-2/15 text-chart-2",
  won: "bg-success/15 text-success",
  lost: "bg-destructive/15 text-destructive",
};

function canAccess(role: string, unit: string) {
  return role === "director" || unit === "bd" || unit === "both";
}

function OpportunitiesPage() {
  const user = useCurrentUser();
  const proposals = useStore((s) => s.proposals);
  const users = useStore((s) => s.users);
  const [stage, setStage] = useState<ProposalStage | "all">("all");
  const [fOwner, setFOwner] = useState<string>("all");
  const [fQuery, setFQuery] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  if (!user) return null;
  if (!canAccess(user.role, user.unit)) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          You do not have access to Opportunities & Proposals.
        </CardContent></Card>
      </div>
    );
  }

  const bdOwners = users.filter((u) => u.unit === "bd" || u.unit === "both" || u.role === "director");

  const visible = useMemo(() => {
    let list = proposals;
    if (stage !== "all") list = list.filter((p) => p.stage === stage);
    if (fOwner !== "all") list = list.filter((p) => p.ownerId === fOwner);
    if (fFrom) list = list.filter((p) => p.expectedCloseDate >= fFrom);
    if (fTo) list = list.filter((p) => p.expectedCloseDate <= fTo);
    const q = fQuery.trim().toLowerCase();
    if (q) list = list.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
    );
    return list;
  }, [proposals, stage, fOwner, fFrom, fTo, fQuery]);

  const totals = useMemo(() => {
    const pipeline = visible.filter((p) => p.stage !== "won" && p.stage !== "lost").reduce((a, p) => a + p.value, 0);
    const won = visible.filter((p) => p.stage === "won").reduce((a, p) => a + p.value, 0);
    return { pipeline, won, count: visible.length };
  }, [visible]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Opportunities & Proposals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track BD pipeline — from prospect to signed contract.
          </p>
        </div>
        <CreateProposalDialog bdOwners={bdOwners} defaultOwnerId={user.id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Open pipeline</div>
          <div className="mt-1 text-xl font-bold">ETB {totals.pipeline.toLocaleString()}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Won value</div>
          <div className="mt-1 text-xl font-bold text-success">ETB {totals.won.toLocaleString()}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Tracked items</div>
          <div className="mt-1 text-xl font-bold">{totals.count}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Search</Label>
            <Input value={fQuery} onChange={(e) => setFQuery(e.target.value)} placeholder="Title, client…" className="h-9 w-52" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Owner</Label>
            <Select value={fOwner} onValueChange={setFOwner}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All owners</SelectItem>
                {bdOwners.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Close from</Label>
            <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Close to</Label>
            <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="h-9 w-40" />
          </div>
          {(fQuery || fOwner !== "all" || fFrom || fTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setFQuery(""); setFOwner("all"); setFFrom(""); setFTo(""); }}>
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={stage === "all" ? "default" : "outline"} onClick={() => setStage("all")}>All</Button>
        {PROPOSAL_STAGES.map((s) => (
          <Button key={s} size="sm" variant={stage === s ? "default" : "outline"} onClick={() => setStage(s)}>
            {PROPOSAL_STAGE_LABELS[s]}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No proposals match your filters.</p>
          </CardContent></Card>
        ) : (
          visible.map((p) => <ProposalRow key={p.id} proposal={p} bdOwners={bdOwners} />)
        )}
      </div>
    </div>
  );
}

function ProposalRow({ proposal, bdOwners }: { proposal: Proposal; bdOwners: ReturnType<typeof useStore.getState>["users"] }) {
  const user = useCurrentUser()!;
  const users = useStore((s) => s.users);
  const setStage = useStore((s) => s.setProposalStage);
  const updateProposal = useStore((s) => s.updateProposal);
  const remove = useStore((s) => s.deleteProposal);
  const owner = users.find((u) => u.id === proposal.ownerId);
  const canEdit = user.role === "director" || user.role === "bd_manager" || user.id === proposal.ownerId || user.id === proposal.createdBy;
  const canDelete = user.role === "director" || user.role === "bd_manager";

  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{proposal.title}</h3>
            <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
              <Briefcase className="mr-1 h-3 w-3" />{proposal.client}
            </Badge>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STAGE_META[proposal.stage]}`}>
              {PROPOSAL_STAGE_LABELS[proposal.stage]}
            </span>
          </div>
          {proposal.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{proposal.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />Owner: <strong className="text-foreground">{owner?.name ?? "—"}</strong>
            </span>
            <span>Value: <strong className="text-foreground">{proposal.currency} {proposal.value.toLocaleString()}</strong></span>
            {proposal.contactPerson && <span>Contact: {proposal.contactPerson}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Close by {proposal.expectedCloseDate}</span>
          </div>
        </div>
        {canEdit && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Select value={proposal.stage} onValueChange={(v) => { setStage(proposal.id, v as ProposalStage); toast.success("Stage updated"); }}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPOSAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{PROPOSAL_STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(user.role === "director" || user.role === "bd_manager") && (
              <Select value={proposal.ownerId} onValueChange={(v) => { updateProposal(proposal.id, { ownerId: v }); toast.success("Owner reassigned"); }}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bdOwners.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {canDelete && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => { remove(proposal.id); toast.success("Proposal removed"); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateProposalDialog({ bdOwners, defaultOwnerId }: { bdOwners: ReturnType<typeof useStore.getState>["users"]; defaultOwnerId: string }) {
  const create = useStore((s) => s.createProposal);
  const [open, setOpen] = useState(false);
  const initial = {
    title: "", client: "", description: "",
    stage: "opportunity" as ProposalStage,
    value: 0, currency: "ETB",
    ownerId: defaultOwnerId,
    expectedCloseDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    contactPerson: "",
  };
  const [form, setForm] = useState(initial);

  const submit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.client.trim()) { toast.error("Client is required"); return; }
    create({
      title: form.title.trim(),
      client: form.client.trim(),
      description: form.description.trim(),
      stage: form.stage,
      value: Number(form.value) || 0,
      currency: form.currency.trim() || "ETB",
      ownerId: form.ownerId,
      expectedCloseDate: form.expectedCloseDate,
      contactPerson: form.contactPerson.trim() || undefined,
    });
    toast.success("Proposal added");
    setOpen(false);
    setForm(initial);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" />New proposal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New opportunity / proposal</DialogTitle>
          <DialogDescription>Track a BD opportunity through its lifecycle.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Client / Prospect</Label>
            <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact person</Label>
            <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as ProposalStage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPOSAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{PROPOSAL_STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {bdOwners.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Value</Label>
            <Input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label>Expected close</Label>
            <Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add proposal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
