import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser, useStore, ALL_TABS, TAB_LABELS } from "@/lib/store";
import type { CustomRole, TabKey } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/roles")({
  component: RolesPage,
});

function RolesPage() {
  const actor = useCurrentUser();
  const customRoles = useStore((s) => s.customRoles);
  const createCustomRole = useStore((s) => s.createCustomRole);
  const updateCustomRole = useStore((s) => s.updateCustomRole);
  const deleteCustomRole = useStore((s) => s.deleteCustomRole);
  const users = useStore((s) => s.users);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);

  if (!actor) return null;
  if (actor.role !== "director") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-8">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Restricted</h2>
              <p className="text-sm text-muted-foreground">Custom roles can only be managed by the M&amp;C Director.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usersByRole = (key: string) => users.filter((u) => u.role === key).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create custom roles, set authority level, and pick which tabs they can see.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />New role</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Custom roles ({customRoles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customRoles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No custom roles yet. Create one to extend the built-in role set.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Visible tabs</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customRoles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.key}</code></TableCell>
                    <TableCell><Badge variant="secondary">{r.rank}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.defaultTabs.map((t) => TAB_LABELS[t]).join(", ")}</TableCell>
                    <TableCell>{usersByRole(r.key)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(r)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete role &quot;{r.label}&quot;?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {usersByRole(r.key) > 0
                                  ? `${usersByRole(r.key)} user(s) currently have this role. They will need to be reassigned manually.`
                                  : "No users currently have this role."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => { deleteCustomRole(r.id); toast.success("Role deleted"); }}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {creating && (
        <RoleDialog
          open
          onOpenChange={(o) => !o && setCreating(false)}
          onSubmit={(data) => {
            // Check key uniqueness
            if (customRoles.some((r) => r.key === data.key)) {
              toast.error("A role with this key already exists");
              return;
            }
            createCustomRole(data);
            toast.success("Role created");
            setCreating(false);
          }}
        />
      )}
      {editing && (
        <RoleDialog
          key={editing.id}
          initial={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSubmit={(data) => {
            updateCustomRole(editing.id, data);
            toast.success("Role updated");
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RoleDialog({
  initial, open, onOpenChange, onSubmit,
}: {
  initial?: CustomRole;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: Omit<CustomRole, "id" | "createdAt" | "createdBy">) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [rank, setRank] = useState(initial?.rank ?? 2);
  const [tabs, setTabs] = useState<TabKey[]>(initial?.defaultTabs ?? ["dashboard", "tasks", "profile"]);

  const toggle = (t: TabKey) =>
    setTabs((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  const submit = () => {
    const finalKey = key.trim() || slugify(label);
    if (!label.trim()) { toast.error("Label is required"); return; }
    if (!finalKey) { toast.error("Key is required"); return; }
    if (!/^[a-z][a-z0-9_]*$/.test(finalKey)) { toast.error("Key must be lowercase letters, numbers, and underscores"); return; }
    if (rank < 1 || rank > 6) { toast.error("Rank must be between 1 and 6"); return; }
    if (tabs.length === 0) { toast.error("Select at least one tab"); return; }
    onSubmit({ label: label.trim(), key: finalKey, rank, defaultTabs: tabs });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit role" : "New role"}</DialogTitle>
          <DialogDescription>Define a custom role with its own authority level and visible tabs.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Display label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Field Coordinator" maxLength={60} />
          </div>
          <div className="grid gap-1.5">
            <Label>Key {!initial && <span className="text-xs text-muted-foreground">(auto-generated from label if empty)</span>}</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="field_coordinator" disabled={!!initial} maxLength={40} />
          </div>
          <div className="grid gap-1.5">
            <Label>Authority rank (1 = junior, 6 = director)</Label>
            <Input type="number" min={1} max={6} value={rank} onChange={(e) => setRank(Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Default visible tabs ({tabs.length})</Label>
            <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border p-2">
              {ALL_TABS.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-muted">
                  <Checkbox checked={tabs.includes(t)} onCheckedChange={() => toggle(t)} />
                  <span>{TAB_LABELS[t]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save changes" : "Create role"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
