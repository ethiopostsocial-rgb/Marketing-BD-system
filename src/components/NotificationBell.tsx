import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, ClipboardList, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, useStore, canApproveTask, isTaskOwner } from "@/lib/store";

interface Notif {
  id: string;
  icon: React.ElementType;
  title: string;
  detail: string;
  to: string;
  tone: "approval" | "task" | "announcement" | "overdue";
}

export function NotificationBell() {
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const tasks = useStore((s) => s.tasks);
  const announcements = useStore((s) => s.announcements);

  const notifs = useMemo<Notif[]>(() => {
    if (!user) return [];
    const today = new Date().toISOString().slice(0, 10);
    const list: Notif[] = [];

    // Tasks awaiting my approval (I'm the line manager)
    tasks
      .filter((t) => t.status === "awaiting_approval" && canApproveTask(user, t, users))
      .forEach((t) => {
        const assignee = users.find((u) => u.id === t.assignedTo);
        list.push({
          id: `appr-${t.id}`,
          icon: CheckCircle2,
          title: "Approval needed",
          detail: `${assignee?.name ?? "Someone"} submitted “${t.title}”`,
          to: "/tasks",
          tone: "approval",
        });
      });

    // Tasks assigned to me that are open
    tasks
      .filter((t) => isTaskOwner(user.id, t) && t.status !== "done")
      .forEach((t) => {
        const overdue = t.dueDate < today;
        list.push({
          id: `mine-${t.id}`,
          icon: ClipboardList,
          title: overdue ? "Overdue task" : t.status === "awaiting_approval" ? "Awaiting approval" : "Your task",
          detail: `${t.title} · due ${t.dueDate}`,
          to: "/tasks",
          tone: overdue ? "overdue" : "task",
        });
      });

    // Recent announcements (last 5)
    announcements.slice(0, 5).forEach((a) => {
      list.push({
        id: `ann-${a.id}`,
        icon: Megaphone,
        title: a.urgency === "high" ? "Urgent announcement" : "Announcement",
        detail: a.title,
        to: "/announcements",
        tone: "announcement",
      });
    });

    return list;
  }, [user, users, tasks, announcements]);

  const unread = notifs.filter((n) => n.tone === "approval" || n.tone === "overdue").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <Badge variant="secondary" className="text-[10px]">{notifs.length}</Badge>
        </div>
        <ScrollArea className="max-h-80">
          {notifs.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifs.map((n) => {
                const Icon = n.icon;
                const toneCls =
                  n.tone === "approval"
                    ? "text-accent-foreground bg-accent/15"
                    : n.tone === "overdue"
                      ? "text-destructive bg-destructive/10"
                      : n.tone === "announcement"
                        ? "text-primary bg-primary/10"
                        : "text-chart-3 bg-chart-3/10";
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      className="flex items-start gap-3 px-3 py-2.5 transition hover:bg-muted/60"
                    >
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toneCls}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground">{n.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{n.detail}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
