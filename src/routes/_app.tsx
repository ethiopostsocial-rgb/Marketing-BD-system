import { createFileRoute, Outlet, redirect, useRouterState, Navigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore, useCurrentUser } from "@/lib/store";
import { LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { SyncIndicator } from "@/components/SyncIndicator";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { loadState, saveState } from "@/lib/sync.client";
import type { SyncStatus } from "@/lib/sync.client";

// ─── Sync ─────────────────────────────────────────────────────────────────────
const SYNCED_KEYS = ["users","tasks","routines","announcements","inventory","externalRequests","proposals","customRoles"] as const;
type SyncedKey = (typeof SYNCED_KEYS)[number];
type Snapshot = Partial<Record<SyncedKey, unknown>>;

function extractSnapshot(s: ReturnType<typeof useStore.getState>): Snapshot {
  const out: Snapshot = {};
  for (const k of SYNCED_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out;
}

interface SyncCtx { status: SyncStatus; isOffline: boolean; lastSyncedAt: string | null; forceSync: () => void; }
export const SyncContext = createContext<SyncCtx>({ status: "idle", isOffline: false, lastSyncedAt: null, forceSync: () => {} });
export function useSyncContext() { return useContext(SyncContext); }

function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]             = useState<SyncStatus>("syncing");
  const [isOffline, setIsOffline]       = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const hydrated    = useRef(false);
  const lastSerial  = useRef("");
  const lastVersion = useRef(0);
  const pushTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight    = useRef(false);

  const doPush = useCallback(async (snap: Snapshot) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("syncing");
    try {
      const { version } = await saveState(snap);
      lastVersion.current = version;
      setLastSyncedAt(new Date().toISOString());
      setStatus("synced");
      setIsOffline(false);
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) { console.error("[Sync] push failed:", e); setStatus("error"); setIsOffline(true); }
    finally { inFlight.current = false; }
  }, []);

  const doPull = useCallback(async (onlyIfNewer = false) => {
    try {
      const result = await loadState();
      if (!result) {
        const snap = extractSnapshot(useStore.getState());
        lastSerial.current = JSON.stringify(snap);
        await doPush(snap);
        return;
      }
      if (onlyIfNewer && result.version <= lastVersion.current) return;
      useStore.setState(result.state as Snapshot, false);
      lastVersion.current = result.version;
      lastSerial.current = JSON.stringify(extractSnapshot(useStore.getState()));
      setLastSyncedAt(new Date().toISOString());
      setIsOffline(false);
    } catch (e) { console.error("[Sync] pull failed:", e); setIsOffline(true); }
  }, [doPush]);

  useEffect(() => {
    setStatus("syncing");
    doPull(false).finally(() => { hydrated.current = true; setStatus("idle"); });
  }, [doPull]);

  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!hydrated.current) return;
      const snap = extractSnapshot(state);
      const serial = JSON.stringify(snap);
      if (serial === lastSerial.current) return;
      lastSerial.current = serial;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => doPush(snap), 800);
    });
    return () => { unsub(); if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [doPush]);

  useEffect(() => {
    const id = setInterval(() => { if (hydrated.current && !inFlight.current) doPull(true); }, 10000);
    return () => clearInterval(id);
  }, [doPull]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible" && hydrated.current) doPull(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [doPull]);

  const forceSync = useCallback(() => {
    const snap = extractSnapshot(useStore.getState());
    lastSerial.current = JSON.stringify(snap);
    doPush(snap);
  }, [doPush]);

  return <SyncContext.Provider value={{ status, isOffline, lastSyncedAt, forceSync }}>{children}</SyncContext.Provider>;
}

// ─── Route ────────────────────────────────────────────────────────────────────
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
  "/dashboard": "Dashboard", "/tasks": "Tasks",
  "/external-requests": "External Requests", "/opportunities": "Opportunities & Proposals",
  "/routines": "Routine Check-ups", "/inventory": "Marketing Material Inventory",
  "/announcements": "Announcements", "/users": "User Management",
  "/roles": "Roles", "/profile": "Profile Settings",
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
                <SyncIndicator />
                <div className="hidden h-4 w-px bg-border sm:block" />
                <div className="hidden text-right text-xs leading-tight sm:block">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-muted-foreground">{user.title}</div>
                </div>
                <NotificationBell />
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={logout} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden"><Outlet /></main>
          </div>
        </div>
      </SidebarProvider>
    </SyncProvider>
  );
}
