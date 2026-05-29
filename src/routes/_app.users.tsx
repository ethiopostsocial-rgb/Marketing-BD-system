import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentUser, useStore, getSubordinateIds, ALL_TABS, TAB_LABELS, defaultTabsForRole, roleLabel } from "@/lib/store";
import { ROLE_LABELS, BUILT_IN_ROLES, type BuiltInRole, type Role, type Unit, type User, type TabKey } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Search, Shield, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_app/users")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("ethiopost-mbd-store");
      if (!raw) throw redirect({ to: "/login" });
    }
  },
  component: UsersPage,
});

const ALL_ROLES: BuiltInRole[] = BUILT_IN_ROLES;

function canManageUsersPage(role: Role) {
  return role === "director" || role === "marketing_manager" || role === "bd_manager";
}

function rolesActorCanAssign(actorRole: Role): BuiltInRole[] {
  if (actorRole === "director") return ALL_ROLES;
  // Managers can create/edit roles below manager level
  return ["supervisor", "senior_officer", "junior_officer"];
}

function UsersPage() {
  const actor = useCurrentUser();
  const users = useStore((s) => s.users);
  const customRoles = useStore((s) => s.customRoles);
  const createUser = useStore((s) => s.createUser);
  const updateUser = useStore((s) => s.updateUser);
  const deleteUser = useStore((s) => s.deleteUser);
  const changePassword = useStore((s) => s.changePassword);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<User | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [forceChange, setForceChange] = useState(true);

  if (!actor) return null;
  if (!canManageUsersPage(actor.role)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-8">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Restricted</h2>
              <p className="text-sm text-muted-foreground">User management is available to managers and the director.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scopeIds =
    actor.role === "director"
      ? users.map((u) => u.id)
      : [actor.id, ...getSubordinateIds(actor.id, users)];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => scopeIds.includes(u.id))
      .filter((u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q),
      );
  }, [users, scopeIds, query]);

  const canEdit = (u: User) =>
    actor.role === "director" ||
    (u.id !== actor.id && scopeIds.includes(u.id) && u.role !== "director");

  const canDelete = (u: User) =>
    actor.role === "director" && u.id !== actor.id;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {actor.role === "director"
              ? "Manage all users across Marketing and Business Development."
              : "Manage users within your reporting line."}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add user
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Directory ({visible.length})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, title…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reports to</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((u) => {
                const mgr = users.find((m) => m.id === u.managerId);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: u.avatarColor }}
                        >
                          {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{u.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{roleLabel(u.role, customRoles)}</Badge></TableCell>
                    <TableCell className="text-sm capitalize">
                      {u.unit === "bd" ? "Business Dev." : u.unit === "both" ? "Both" : "Marketing"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mgr?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!canEdit(u)}
                          onClick={() => setEditing(u)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {actor.role === "director" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setResetting(u); setNewPwd(""); setForceChange(true); }}
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete(u) ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the user. Their direct reports will be reassigned to {mgr?.name ?? "no manager"}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteUser(u.id);
                                    toast.success(`${u.name} deleted`);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button size="icon" variant="ghost" disabled title="Only the Director can delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <UserDialog
          key={editing.id}
          mode="edit"
          actor={actor}
          users={users}
          customRoles={customRoles}
          initial={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSubmit={(patch) => {
            updateUser(editing.id, patch);
            toast.success("User updated");
            setEditing(null);
          }}
        />
      )}

      {creating && (
        <UserDialog
          mode="create"
          actor={actor}
          users={users}
          customRoles={customRoles}
          open
          onOpenChange={(o) => !o && setCreating(false)}
          onSubmit={(data) => {
            createUser({
              name: data.name!,
              email: data.email!,
              role: data.role!,
              unit: data.unit!,
              managerId: data.managerId ?? null,
              title: data.title!,
              password: "ethiopost",
              mustChangePassword: true,
              visibleTabs: data.visibleTabs,
            });
            toast.success("User created — default password is 'ethiopost' (must change on first login)");
            setCreating(false);
          }}
        />
      )}

      {resetting && (
        <Dialog open onOpenChange={(o) => !o && setResetting(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset password — {resetting.name}</DialogTitle>
              <DialogDescription>
                Set a new password for this user. They will use it to sign in next time.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="new-pwd">New password</Label>
                <Input
                  id="new-pwd"
                  type="text"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={forceChange} onChange={(e) => setForceChange(e.target.checked)} />
                Require user to change password on next login
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setResetting(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (newPwd.length < 8) { toast.error("Password must be at least 8 characters"); return; }
                  changePassword(resetting.id, newPwd);
                  if (forceChange) updateUser(resetting.id, { mustChangePassword: true });
                  toast.success(`Password reset for ${resetting.name}`);
                  setResetting(null);
                }}
              >
                Reset password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface UserFormData {
  name?: string;
  email?: string;
  role?: Role;
  unit?: Unit;
  managerId?: string | null;
  title?: string;
  visibleTabs?: TabKey[];
}

function UserDialog({
  mode, actor, users, customRoles, initial, open, onOpenChange, onSubmit,
}: {
  mode: "create" | "edit";
  actor: User;
  users: User[];
  customRoles: import("@/lib/types").CustomRole[];
  initial?: User;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: UserFormData) => void;
}) {
  const allowedBuiltIns = rolesActorCanAssign(actor.role);
  // Director may also assign custom roles; managers cannot.
  const assignableRoles: { key: Role; label: string }[] = [
    ...allowedBuiltIns.map((r) => ({ key: r as Role, label: ROLE_LABELS[r] })),
    ...(actor.role === "director"
      ? customRoles.map((r) => ({ key: r.key as Role, label: `${r.label} (custom)` }))
      : []),
  ];
  const [form, setForm] = useState<UserFormData>(
    initial
      ? {
          name: initial.name,
          email: initial.email,
          role: initial.role,
          unit: initial.unit,
          managerId: initial.managerId,
          title: initial.title,
          visibleTabs: initial.visibleTabs,
        }
      : { unit: "marketing", role: assignableRoles[assignableRoles.length - 1]?.key ?? "junior_officer", managerId: actor.id, visibleTabs: undefined },
  );
  const isDirector = actor.role === "director";
  const effectiveTabs: TabKey[] =
    form.visibleTabs ??
    defaultTabsForRole({
      role: (form.role ?? "junior_officer") as Role,
      unit: (form.unit ?? "marketing") as Unit,
    } as User, customRoles);
  const customTabs = form.visibleTabs !== undefined;
  const toggleTab = (t: TabKey) => {
    const current = new Set(effectiveTabs);
    if (current.has(t)) current.delete(t);
    else current.add(t);
    setForm({ ...form, visibleTabs: Array.from(current) });
  };

  const possibleManagers = users.filter(
    (u) => u.id !== initial?.id && (actor.role === "director" || u.id === actor.id || getSubordinateIdsLocal(actor.id, users).includes(u.id)),
  );

  const submit = () => {
    if (!form.name?.trim() || !form.email?.trim() || !form.role || !form.unit || !form.title?.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid email");
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add user" : "Edit user"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new account in your reporting scope." : "Update role, unit, and reporting line."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="u-name">Full name</Label>
            <Input id="u-name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="u-title">Title</Label>
            <Input id="u-title" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as Role })}
              >
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as Unit })}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="bd">Business Development</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Reports to</Label>
            <Select
              value={form.managerId ?? "none"}
              onValueChange={(v) => setForm({ ...form, managerId: v === "none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {possibleManagers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} · {roleLabel(m.role, customRoles)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isDirector && (
            <div className="grid gap-2 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Visible tabs & functions</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={customTabs}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        visibleTabs: e.target.checked ? effectiveTabs : undefined,
                      })
                    }
                  />
                  Override role defaults
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {customTabs
                  ? "Pick exactly which sections this user can see in the sidebar."
                  : "Using role-based defaults. Enable override to customize."}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_TABS.map((t) => {
                  const checked = effectiveTabs.includes(t);
                  return (
                    <label
                      key={t}
                      className={`flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5 text-xs ${customTabs ? "cursor-pointer" : "opacity-70"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!customTabs}
                        onChange={() => toggleTab(t)}
                      />
                      <span>{TAB_LABELS[t]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{mode === "create" ? "Create user" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getSubordinateIdsLocal(userId: string, users: User[]): string[] {
  const direct = users.filter((u) => u.managerId === userId).map((u) => u.id);
  return direct.flatMap((id) => [id, ...getSubordinateIdsLocal(id, users)]);
}
