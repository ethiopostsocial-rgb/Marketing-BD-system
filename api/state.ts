/**
 * Vercel Serverless Function — /api/state
 * GitHub is the sole database. No Neon/Postgres required.
 *
 * GET  /api/state  → reads snapshots/state.json from GitHub
 * POST /api/state  → writes snapshots/state.json to GitHub
 *
 * Required Vercel env vars:
 *   GITHUB_TOKEN   — Personal Access Token (repo scope)
 *   GITHUB_REPO    — "owner/repo"  e.g. "ethiopostsocial-rgb/Marketing-BD-system"
 *   GITHUB_BRANCH  — branch (default: "main")
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const SNAPSHOT_PATH = "snapshots/state.json";

function cfg() {
  return {
    token:  process.env.GITHUB_TOKEN ?? "",
    repo:   process.env.GITHUB_REPO  ?? "",
    branch: process.env.GITHUB_BRANCH ?? "main",
  };
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ethiopost-sync/2.0",
    "Content-Type": "application/json",
  };
}

interface GitHubFile {
  data: unknown;
  sha: string;
  version: number;
}

/** Read state.json from GitHub. Returns null if file doesn't exist yet (404). */
async function ghRead(token: string, repo: string, branch: string): Promise<GitHubFile | null> {
  const url = `https://api.github.com/repos/${repo}/contents/${SNAPSHOT_PATH}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: ghHeaders(token) });

  if (res.status === 404) return null; // first boot — file not created yet

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub GET ${res.status}: ${txt.slice(0, 300)}`);
  }

  const json = (await res.json()) as { content: string; sha: string };
  const raw  = Buffer.from(json.content, "base64").toString("utf-8");
  const parsed = JSON.parse(raw) as { version?: number; state: unknown };

  return { data: parsed.state, sha: json.sha, version: parsed.version ?? 1 };
}

/** Write state.json to GitHub — creates file on first call, updates on subsequent. */
async function ghWrite(
  token: string, repo: string, branch: string,
  state: unknown, sha: string | undefined, version: number,
): Promise<void> {
  const url     = `https://api.github.com/repos/${repo}/contents/${SNAPSHOT_PATH}`;
  const content = Buffer.from(JSON.stringify({ version, state }, null, 2)).toString("base64");

  const body: Record<string, unknown> = {
    message: `sync: v${version} @ ${new Date().toISOString()}`,
    content,
    branch,
  };
  if (sha) body.sha = sha; // omit sha on first create, required on update

  const res = await fetch(url, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub PUT ${res.status}: ${txt.slice(0, 300)}`);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { token, repo, branch } = cfg();

  if (!token || !repo) {
    return res.status(503).json({
      ok: false,
      error: "GITHUB_TOKEN and GITHUB_REPO must be set in Vercel Environment Variables.",
    });
  }

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const file = await ghRead(token, repo, branch);
      if (!file) return res.status(200).json({ ok: true, state: null, version: 0 });
      return res.status(200).json({ ok: true, state: file.data, version: file.version });
    } catch (e) {
      console.error("[api/state] GET error:", e);
      return res.status(500).json({ ok: false, error: "Failed to read from GitHub." });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = req.body as { state?: unknown };
      if (!body?.state) {
        return res.status(400).json({ ok: false, error: "Body must contain { state }" });
      }

      // Read current file to get sha (needed to update) and bump version
      const current    = await ghRead(token, repo, branch);
      const newVersion = (current?.version ?? 0) + 1;

      await ghWrite(token, repo, branch, body.state, current?.sha, newVersion);

      return res.status(200).json({ ok: true, version: newVersion });
    } catch (e) {
      console.error("[api/state] POST error:", e);
      return res.status(500).json({ ok: false, error: "Failed to write to GitHub." });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed." });
}
