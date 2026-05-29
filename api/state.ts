import type { VercelRequest, VercelResponse } from "@vercel/node";

const DATA_PATH = "data/state.json";
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN  ?? "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";
const GITHUB_REPO   = process.env.GITHUB_REPO   ?? "ethiopostsocial-rgb/Marketing-BD-system";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ethiopost-connect/1.0",
    "Content-Type": "application/json",
  };
}

async function readFile() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const res = await fetch(url, { headers: headers() });
  if (res.status === 404) return { content: null, sha: undefined, version: 0 };
  if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { content: string; sha: string };
  const decoded = Buffer.from(json.content, "base64").toString("utf-8");
  const parsed = JSON.parse(decoded) as { version: number; state: unknown };
  return { content: parsed.state, sha: json.sha, version: parsed.version ?? 0 };
}

async function writeFile(state: unknown, sha: string | undefined, version: number) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}`;
  const content = Buffer.from(JSON.stringify({ version, state }, null, 2)).toString("base64");
  const body: Record<string, unknown> = {
    message: `sync: v${version} @ ${new Date().toISOString()}`,
    content,
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const { content, version } = await readFile();
      if (content === null) return res.status(200).json({ ok: true, state: null, version: 0 });
      return res.status(200).json({ ok: true, state: content, version });
    } catch (e) {
      console.error("[api/state] GET failed:", e);
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body as { state?: unknown };
      if (!body?.state) return res.status(400).json({ ok: false, error: "Missing state" });
      const { sha, version: v } = await readFile();
      await writeFile(body.state, sha, v + 1);
      return res.status(200).json({ ok: true, version: v + 1 });
    } catch (e) {
      console.error("[api/state] POST failed:", e);
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
