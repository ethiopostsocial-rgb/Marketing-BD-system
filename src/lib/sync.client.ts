/**
 * Client-side sync API.
 *
 * All calls go to /api/state (Vercel serverless function).
 * The GitHub token and DATABASE_URL never reach the browser.
 */

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface LoadResult {
  state: unknown;
  version: number;
}

/** Pull the latest state from the server. Returns null if no data exists yet. */
export async function loadState(): Promise<LoadResult | null> {
  const res = await fetch("/api/state", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    // No-cache: always fetch fresh data
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Server error ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as { ok: boolean; error?: string; state: unknown; version: number };

  if (!json.ok) {
    throw new Error(json.error ?? "Unknown server error");
  }

  if (!json.state) return null;

  return { state: json.state, version: json.version };
}

/** Push state to the server. Returns the new version number. */
export async function saveState(state: unknown): Promise<{ version: number }> {
  const res = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });

  if (!res.ok) {
    throw new Error(`Server error ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as { ok: boolean; error?: string; version: number };

  if (!json.ok) {
    throw new Error(json.error ?? "Unknown server error");
  }

  return { version: json.version };
}

/** Check if the API is reachable (fast health check using HEAD-like GET). */
export async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch("/api/state", { method: "GET", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
