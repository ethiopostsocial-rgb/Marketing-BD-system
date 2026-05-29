import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import type { Announcement, Unit } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/announcements")({
  component: AnnouncementsPage,
});

const URGENCY_META: Record<string, { label: string; cls: string }> = {
  high: { label: "Urgent", cls: "border-destructive/40 bg-destructive/10 text-destructive" },
  normal: { label: "Normal", cls: "border-primary/30 bg-primary/5 text-primary" },
  low: { label: "FYI", cls: "border-border bg-muted text-muted-foreground" },
};

function AnnouncementsPage() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const announcements = useStore((s) => s.announcements);
  if (!user) return null;

  const canPublish = user.role === "director" || user.role.endsWith("manager");

  const base = useMemo(() => {
    return announcements
      .filter((a) => user.role === "director" || a.audience === "both" || a.audience === user.unit)
      .sort((a, b) => {
        const order = { high: 0, normal: 1, low: 2 } as const;
        if (order[a.urgency] !== order[b.urgency]) return order[a.urgency] - order[b.urgency];
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [announcements, user]);

  const [fAudience, setFAudience] = useState<"all" | Unit>("all");
  const [fUrgency, setFUrgency] = useState<"all" | "low" | "normal" | "high">("all");
  const [fAuthor, setFAuthor] = useState<string>("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fQuery, setFQuery] = useState("");

  const authorOptions = useMemo(() => {
    const ids = new Set(base.map((a) => a.authorId));
    return users.filter((u) => ids.has(u.id));
  }, [base, users]);

  const visible = useMemo(() => base.filter((a) => {
    if (fAudience !== "all" && a.audience !== fAudience) return false;
    if (fUrgency !== "all" && a.urgency !== fUrgency) return false;
    if (fAuthor !== "all" && a.authorId !== fAuthor) return false;
    if (fFrom && a.createdAt < fFrom) return false;
    if (fTo && a.createdAt > fTo) return false;
    const q = fQuery.trim().toLowerCase();
    if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
    return true;
  }), [base, fAudience, fUrgency, fAuthor, fFrom, fTo, fQuery]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="mt-1 text-sm text-muted-foreground">{canPublish ? "Publish updates to your unit or company-wide." : "Notices from your leadership."}</p>
        </div>
        {canPublish && <CreateAnnouncementDialog />}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Search</Label>
            <Input value={fQuery} onChange={(e) => setFQuery(e.target.value)} placeholder="Title or body…" className="h-9 w-52" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Audience</Label>
            <Select value={fAudience} onValueChange={(v) => setFAudience(v as typeof fAudience)}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All audiences</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="bd">Business Dev</SelectItem>
                <SelectItem value="both">Company-wide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Urgency</Label>
            <Select value={fUrgency} onValueChange={(v) => setFUrgency(v as typeof fUrgency)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">FYI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">Author</Label>
            <Select value={fAuthor} onValueChange={setFAuthor}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All authors</SelectItem>
                {authorOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">From</Label>
            <Input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="h-9 w-40" />
          </div>
          <div className="space-y-1"><Label className="text-[11px] text-muted-foreground">To</Label>
            <Input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">

        {visible.map((a) => {
          const author = users.find((u) => u.id === a.authorId);
          const m = URGENCY_META[a.urgency];
          return (
            <Card key={a.id} className={`border-l-4 ${a.urgency === "high" ? "border-l-destructive" : a.urgency === "normal" ? "border-l-primary" : "border-l-border"}`}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${m.cls}`}>
                    {a.urgency === "high" && <AlertTriangle className="h-3 w-3" />}
                    {m.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {a.audience === "both" ? "Company-wide" : a.audience === "marketing" ? "Marketing" : "Business Dev"}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{a.createdAt}</span>
                  {canPublish && (user.role === "director" || a.authorId === user.id) && (
                    <EditAnnouncementDialog announcement={a} />
                  )}
                  {user.role === "director" && <DeleteAnnouncementButton id={a.id} title={a.title} />}
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: author?.avatarColor ?? "var(--primary)" }}>
                    {author?.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  Posted by <strong className="text-foreground">{author?.name}</strong> · {author?.title}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {visible.length === 0 && (
          <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

function CreateAnnouncementDialog() {
  const user = useCurrentUser()!;
  const create = useStore((s) => s.createAnnouncement);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; body: string; audience: Unit; urgency: "low" | "normal" | "high" }>({
    title: "", body: "", audience: user.unit, urgency: "normal",
  });

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Title and body are required"); return; }
    create({ title: form.title.trim(), body: form.body.trim(), authorId: user.id, audience: form.audience, urgency: form.urgency });
    toast.success("Announcement published");
    setOpen(false);
    setForm({ ...form, title: "", body: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />New announcement</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish announcement</DialogTitle>
          <DialogDescription>Posted instantly to the chosen audience.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
          <div className="space-y-1.5"><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} maxLength={1000} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as Unit })} disabled={user.role !== "director"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(user.role === "director" || user.unit === "marketing") && <SelectItem value="marketing">Marketing</SelectItem>}
                  {(user.role === "director" || user.unit === "bd") && <SelectItem value="bd">Business Dev</SelectItem>}
                  {user.role === "director" && <SelectItem value="both">Company-wide</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as "low" | "normal" | "high" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">FYI</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAnnouncementDialog({ announcement }: { announcement: Announcement }) {
  const user = useCurrentUser()!;
  const update = useStore((s) => s.updateAnnouncement);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; body: string; audience: Unit; urgency: "low" | "normal" | "high" }>({
    title: announcement.title, body: announcement.body, audience: announcement.audience, urgency: announcement.urgency,
  });

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Title and body are required"); return; }
    update(announcement.id, { title: form.title.trim(), body: form.body.trim(), audience: form.audience, urgency: form.urgency });
    toast.success("Announcement updated");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit announcement</DialogTitle>
          <DialogDescription>Changes are visible immediately to the audience.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} /></div>
          <div className="space-y-1.5"><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} maxLength={1000} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v as Unit })} disabled={user.role !== "director"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(user.role === "director" || user.unit === "marketing") && <SelectItem value="marketing">Marketing</SelectItem>}
                  {(user.role === "director" || user.unit === "bd") && <SelectItem value="bd">Business Dev</SelectItem>}
                  {user.role === "director" && <SelectItem value="both">Company-wide</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as "low" | "normal" | "high" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">FYI</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

function DeleteAnnouncementButton({ id, title }: { id: string; title: string }) {
  const remove = useStore((s) => s.deleteAnnouncement);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
          <AlertDialogDescription>"{title}" will be permanently removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { remove(id); toast.success("Announcement deleted"); }}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
