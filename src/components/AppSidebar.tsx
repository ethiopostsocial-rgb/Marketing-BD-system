import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, ClipboardCheck, Megaphone, User as UserIcon, LogOut, Users, Package, Building2, Briefcase, ShieldCheck, BarChart2 } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { EthiopostLogo } from "./EthiopostLogo";
import { useCurrentUser, useStore, canAccessTab, roleLabel } from "@/lib/store";
import type { TabKey } from "@/lib/types";
import { Button } from "./ui/button";

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; tab: TabKey }[] = [
  { to: "/dashboard",           label: "Dashboard",                 icon: LayoutDashboard, tab: "dashboard" },
  { to: "/commercial-dashboard",label: "Commercial Dashboard",      icon: BarChart2,       tab: "commercial_dashboard" },
  { to: "/tasks",               label: "Tasks",                     icon: ListChecks,      tab: "tasks" },
  { to: "/external-requests",   label: "External Requests",         icon: Building2,       tab: "external_requests" },
  { to: "/opportunities",       label: "Opportunities & Proposals",  icon: Briefcase,       tab: "opportunities" },
  { to: "/routines",            label: "Routine Check-ups",         icon: ClipboardCheck,  tab: "routines" },
  { to: "/inventory",           label: "Marketing Inventory",       icon: Package,         tab: "inventory" },
  { to: "/announcements",       label: "Announcements",             icon: Megaphone,       tab: "announcements" },
  { to: "/users",               label: "User Management",           icon: Users,           tab: "users" },
  { to: "/roles",               label: "Roles",                     icon: ShieldCheck,     tab: "roles" },
  { to: "/profile",             label: "Profile Settings",          icon: UserIcon,        tab: "profile" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const user = useCurrentUser();
  const customRoles = useStore((s) => s.customRoles);
  const logout = useStore((s) => s.logout);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        {!collapsed ? <EthiopostLogo size={36} /> : <EthiopostLogo size={28} />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.filter((item) => user && canAccessTab(user, item.tab, customRoles)).map((item) => {
                const active = path.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-2.5 rounded-md bg-sidebar-accent/50 p-2">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: user.avatarColor }}
              >
                {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</div>
                <div className="truncate text-[11px] text-sidebar-foreground/60">{roleLabel(user.role, customRoles)}</div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Sign out"}
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
