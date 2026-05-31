/**
 * SyncProvider — GitHub-backed real-time sync.
 *
 * Improvements over previous version:
 *  - Push debounce reduced to 500 ms (was 1500 ms) → faster saves
 *  - Poll every 10 s (was 30 s) → everyone sees changes faster
 *  - Parallel push: doesn't block if a push is already in flight — queues one retry
 *  - currentUserId excluded from sync (each browser keeps its own session)
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { loadState, saveState, type SyncStatus } from "@/lib/sync.client";

const SYNCED_KEYS = [
  "users",
  "tasks",
  "routines",
  "announcements",
  "inventory",
  "externalRequests",
  "proposals",
  "customRoles",
] as const;

type SyncedKey = (typeof SYNCED_KEYS)[number];
type Snapshot  = Partial<Record<SyncedKey, unknown>>;

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
  status: "idle",
  isOffline: false,
  lastSyncedAt: null,
  forceSync: () => {},
});

export function useSyncContext() {
  return useContext(SyncContext);
}

const PUSH_DEBOUNCE_MS = 500;   // 0.5 s after last change → push
const POLL_INTERVAL_MS = 10000; // check GitHub every 10 s

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status,       setStatus]       = useState<SyncStatus>("syncing");
  const [isOffline,    setIsOffline]    = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const hydrated    = useRef(false);
  const lastSerial  = useRef("");
  const lastVersion = useRef(0);
  const pushTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight    = useRef(false);
  const pendingSnap = useRef<Snapshot | null>(null); // queued while inFlight

  // ── Push ─────────────────────────────────────────────────────────────────
  const doPush = async (snap: Snapshot) => {
    if (inFlight.current) {
      pendingSnap.current = snap; // queue it — will be flushed after current push
      return;
    }
    inFlight.current = true;
    setStatus("syncing");
    try {
      const { version } = await saveState(snap);
      lastVersion.current = version;
      setLastSyncedAt(new Date().toISOString());
      setStatus("synced");
      setIsOffline(false);
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e) {
      console.error("[SyncProvider] push failed:", e);
      setStatus("error");
      setIsOffline(true);
    } finally {
      inFlight.current = false;
      // Flush any change that arrived while we were pushing
      if (pendingSnap.current) {
        const queued = pendingSnap.current;
        pendingSnap.current = null;
        doPush(queued);
      }
    }
  };

  // ── Pull ─────────────────────────────────────────────────────────────────
  const doPull = async (onlyIfNewer = false) => {
    try {
      const result = await loadState();
      if (!result) {
        // GitHub file doesn't exist yet — push seed data to create it
        const snap = extractSnapshot(useStore.getState());
        lastSerial.current = JSON.stringify(snap);
        await doPush(snap);
        return;
      }
      if (onlyIfNewer && result.version <= lastVersion.current) return;

      applySnapshot(result.state as Snapshot);
      lastVersion.current = result.version;
      lastSerial.current  = JSON.stringify(extractSnapshot(useStore.getState()));
      setLastSyncedAt(new Date().toISOString());
      setIsOffline(false);
      setStatus("synced");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e) {
      console.error("[SyncProvider] pull failed:", e);
      setIsOffline(true);
      setStatus("error");
    }
  };

  // ── 1. Pull on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    setStatus("syncing");
    doPull(false).finally(() => {
      hydrated.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Push on every store change (debounced 500 ms) ─────────────────────
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
    return () => {
      unsub();
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 3. Poll every 10 s for other users' changes ───────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (!hydrated.current || inFlight.current) return;
      doPull(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forceSync = () => {
    const snap = extractSnapshot(useStore.getState());
    lastSerial.current = JSON.stringify(snap);
    doPush(snap);
  };

  return (
    <SyncContext.Provider value={{ status, isOffline, lastSyncedAt, forceSync }}>
      {children}
    </SyncContext.Provider>
  );
}
