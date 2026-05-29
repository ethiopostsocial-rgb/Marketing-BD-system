import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser, useStore, getSubordinateIds, roleLabel } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, KeyRound, Mail, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const customRoles = useStore((s) => s.customRoles);
  if (!user) return null;

  const manager = users.find((u) => u.id === user.managerId);
  const subs = getSubordinateIds(user.id, users).map((id) => users.find((u) => u.id === id)!);

  const permissions: { label: string; ok: boolean }[] = [
    { label: "View all unit data", ok: user.role === "director" },
    { label: "View own unit data", ok: user.role === "director" || user.role.endsWith("manager") },
    { label: "Assign tasks to subordinates", ok: ["director", "marketing_manager", "bd_manager", "supervisor"].includes(user.role) },
    { label: "Create cross-functional tasks", ok: ["director", "marketing_manager", "bd_manager"].includes(user.role) },
    { label: "Manage routine jobs", ok: user.role === "director" || user.role.endsWith("manager") },
    { label: "Publish announcements", ok: user.role === "director" || user.role.endsWith("manager") },
    { label: "Approve task completion", ok: ["director", "marketing_manager", "bd_manager", "supervisor"].includes(user.role) },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your account, role, and access rights.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/change-password"><KeyRound className="mr-2 h-4 w-4" /> Change password</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-start gap-5 p-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
              style={{ background: user.avatarColor }}>
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold tracking-tight">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{roleLabel(user.role, customRoles)}</Badge>
                <Badge variant="outline" className="border-accent/40 bg-accent/10">
                  {user.unit === "both" ? "Both Units" : user.unit === "bd" ? "Business Development" : "Marketing"}
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <Row icon={Mail} label="Email" value={user.email} />
                <Row icon={Building2} label="Unit" value={user.unit === "both" ? "All Units" : user.unit === "bd" ? "Business Development" : "Marketing"} />
                <Row icon={Users} label="Reports to" value={manager?.name ?? "—"} />
                <Row icon={ShieldCheck} label="Direct reports" value={String(users.filter((u) => u.managerId === user.id).length)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {permissions.map((p) => (
              <div key={p.label} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span className="text-foreground">{p.label}</span>
                <span className={`text-xs font-semibold ${p.ok ? "text-success" : "text-muted-foreground"}`}>{p.ok ? "Granted" : "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {subs.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Team ({subs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subs.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: s.avatarColor }}>
                    {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{roleLabel(s.role, customRoles)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs uppercase tracking-wider">{label}:</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  );
}
