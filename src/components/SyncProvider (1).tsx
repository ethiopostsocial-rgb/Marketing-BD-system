/**
 * SyncProvider — real-time sync across all devices via GitHub API.
 * - Pushes changes 0.8s after last edit
 * - Polls every 10s for changes from other users
 * - Re-pulls when tab becomes visible
 * - currentUserId is local-only (users don't kick each other out)
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { loadState, saveState, type SyncStatus } from "@/lib/sync.client";

const SYNCED_KEYS = [
  "users", "tasks", "routines", "announcements",
  "inventory", "externalRequests", "proposals", "customRoles",
] as const;

type SyncedKey = (typeof SYNCED_KEYS)[number];
type Snapshot = Partial<Record<SyncedKey, unknown>>;

function extractSnapshot(s: ReturnType<typeof useStore.getState>): Snapshot {
  const out: Snapshot = {};
  for (const k of SYNCED_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out;
}

function applySnapshot(snap: Snapshot) {
  useStore.setState(snap as Parameters<typeof useStore.setState>[0], false);
}

interface SyncCtx {
  status: SyncStatus;
  isOffline: boolean;
  lastSyncedAt: string | null;
  forceSync: () => void;
}

const SyncContext = createContext<SyncCtx>({
  status: "idle", isOffline: false, lastSyncedAt: null, forceSync: () => {},
});

export function useSyncContext() { return useContext(SyncContext); }

const PUSH_DEBOUNCE_MS = 800;
const POLL_INTERVAL_MS = 10000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
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
    } catch (e) {
      console.error("[Sync] push failed:", e);
      setStatus("error");
      setIsOffline(true);
    } finally {
      inFlight.current = false;
    }
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
      applySnapshot(result.state as Snapshot);
      lastVersion.current = result.version;
      lastSerial.current = JSON.stringify(extractSnapshot(useStore.getState()));
      setLastSyncedAt(new Date().toISOString());
      setIsOffline(false);
    } catch (e) {
      console.error("[Sync] pull failed:", e);
      setIsOffline(true);
    }
  }, [doPush]);

  // 1. Pull on mount
  useEffect(() => {
    setStatus("syncing");
    doPull(false).finally(() => {
      hydrated.current = true;
      setStatus("idle");
    });
  }, [doPull]);

  // 2. Push debounced on every store change
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!hydrated.current) return;
      const snap   = extractSnapshot(state);
      const serial = JSON.stringify(snap);
      if (serial === lastSerial.current) return;
      lastSerial.current = serial;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => doPush(snap), PUSH_DEBOUNCE_MS);
    });
    return () => { unsub(); if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [doPush]);

  // 3. Poll every 10s
  useEffect(() => {
    const id = setInterval(() => {
      if (hydrated.current && !inFlight.current) doPull(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [doPull]);

  // 4. Pull when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && hydrated.current) doPull(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [doPull]);

  const forceSync = useCallback(() => {
    const snap = extractSnapshot(useStore.getState());
    lastSerial.current = JSON.stringify(snap);
    doPush(snap);
  }, [doPush]);

  return (
    <SyncContext.Provider value={{ status, isOffline, lastSyncedAt, forceSync }}>
      {children}
    </SyncContext.Provider>
  );
}
