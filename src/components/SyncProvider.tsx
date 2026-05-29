/**
 * SyncProvider
 *
 * Wraps the authenticated layout. Responsibilities:
 *  1. On mount   → pull latest state from /api/state → apply to store
 *  2. On changes → debounce 1.5 s → push full state to /api/state
 *  3. Every 30 s → poll /api/state → apply if a newer version exists
 *  4. First boot → no remote state yet → push local seed data up
 *
 * currentUserId is intentionally excluded from sync so each browser
 * keeps its own session — users don't get logged out by other users.
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { loadState, saveState, type SyncStatus } from "@/lib/sync.client";

// ─── Keys synced to the database ─────────────────────────────────────────────
// currentUserId is intentionally LOCAL-ONLY
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
type Snapshot = Partial<Record<SyncedKey, unknown>>;

function extractSnapshot(s: ReturnType<typeof useStore.getState>): Snapshot {
  const out: Snapshot = {};
  for (const k of SYNCED_KEYS) {
    out[k] = (s as unknown as Record<string, unknown>)[k];
  }
  return out;
}

function applySnapshot(snap: Snapshot) {
  // Merge — never touch currentUserId
  useStore.setState(snap as Parameters<typeof useStore.setState>[0], false);
}

// ─── Context (exposes sync status to child components) ───────────────────────
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

// ─── Provider ────────────────────────────────────────────────────────────────
const PUSH_DEBOUNCE_MS = 1500;  // wait 1.5 s after last change before pushing
const POLL_INTERVAL_MS = 30000; // poll for remote changes every 30 s

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]           = useState<SyncStatus>("syncing");
  const [isOffline, setIsOffline]     = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const hydrated       = useRef(false);
  const lastSerial     = useRef("");
  const lastVersion    = useRef(0);
  const pushTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight       = useRef(false);

  // ── Helper: push snapshot ────────────────────────────────────────────────
  const doPush = async (snap: Snapshot) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("syncing");
    try {
      const { version } = await saveState(snap);
      lastVersion.current = version;
      setLastSyncedAt(new Date().toISOString());
      setStatus("synced");
      setIsOffline(false);
      // Reset to idle after 2 s so indicator doesn't flash indefinitely
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      console.error("[SyncProvider] push failed:", e);
      setStatus("error");
      setIsOffline(true);
    } finally {
      inFlight.current = false;
    }
  };

  // ── Helper: pull and apply ────────────────────────────────────────────────
  const doPull = async (onlyIfNewer = false) => {
    try {
      const result = await loadState();
      if (!result) {
        // Database is empty — push local seed data up so others can get it
        const snap = extractSnapshot(useStore.getState());
        lastSerial.current = JSON.stringify(snap);
        await doPush(snap);
        return;
      }
      if (onlyIfNewer && result.version <= lastVersion.current) return;

      applySnapshot(result.state as Snapshot);
      lastVersion.current = result.version;
      // Update serial so the subscribe handler doesn't immediately re-push
      lastSerial.current = JSON.stringify(extractSnapshot(useStore.getState()));
      setLastSyncedAt(new Date().toISOString());
      setIsOffline(false);
    } catch (e) {
      console.error("[SyncProvider] pull failed:", e);
      setIsOffline(true);
    }
  };

  // ── 1. Initial pull on mount ──────────────────────────────────────────────
  useEffect(() => {
    setStatus("syncing");

    doPull(false).finally(() => {
      hydrated.current = true;
      setStatus("idle");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Auto-push on every store change (debounced) ───────────────────────
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (!hydrated.current) return;

      const snap   = extractSnapshot(state);
      const serial = JSON.stringify(snap);
      if (serial === lastSerial.current) return; // nothing relevant changed

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

  // ── 3. Poll every 30 s for remote changes (other users) ──────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hydrated.current || inFlight.current) return;
      doPull(true); // only apply if server version is newer
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force sync (called from SyncIndicator button) ────────────────────────
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
