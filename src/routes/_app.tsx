import { createFileRoute, Outlet, redirect, useRouterState, Navigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore, useCurrentUser } from "@/lib/store";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { SyncProvider } from "@/components/SyncProvider";
import { SyncIndicator } from "@/components/SyncIndicator";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("ethiopost-mbd-store");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (!parsed?.state?.currentUserId) throw redirect({ to: "/login" });
        } catch (e) {
          if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
          throw redirect({ to: "/login" });
        }
      } else {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AppLayout,
});

const TITLES: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/tasks":                "Tasks",
  "/external-requests":    "External Requests",
  "/opportunities":        "Opportunities & Proposals",
  "/routines":             "Routine Check-ups",
  "/inventory":            "Marketing Material Inventory",
  "/announcements":        "Announcements",
  "/commercial-dashboard": "Commercial Dashboard",
  "/users":                "User Management",
  "/roles":                "Roles",
  "/profile":              "Profile Settings",
};

function AppLayout() {
  const path  = useRouterState({ select: (r) => r.location.pathname });
  const title = Object.keys(TITLES).find((k) => path.startsWith(k));
  const user  = useCurrentUser();
  const logout = useStore((s) => s.logout);

  if (!user) return <Navigate to="/login" />;
  if (user.mustChangePassword) return <Navigate to="/change-password" />;

  return (
    <SyncProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="hidden h-5 w-px bg-border sm:block" />
                <h1 className="text-base font-semibold text-foreground">
                  {title ? TITLES[title] : "Ethiopost"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {/* Live sync badge — shows syncing/synced/error and allows force-sync */}
                <SyncIndicator />
                <div className="hidden h-4 w-px bg-border sm:block" />
                <div className="hidden text-right text-xs leading-tight sm:block">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-muted-foreground">{user.title}</div>
                </div>
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={logout}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SyncProvider>
  );
}
