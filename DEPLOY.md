# EthiopostConnect — Deployment Guide
## GitHub + Vercel (No external database needed)

Your state is stored as a JSON file directly in your GitHub repository.
No Neon, no Supabase, no MongoDB — just GitHub and Vercel.

---

## How the sync works

```
User makes a change in the app
  └─ Zustand store updates instantly (local)
       └─ SyncProvider detects change (1.5s debounce)
            └─ POST /api/state  (Vercel serverless function)
                 └─ Writes data/state.json to your GitHub repo

Another user opens the app (or every 30s)
  └─ GET /api/state
       └─ Reads data/state.json from GitHub
            └─ Applies latest data to their store
```

Your GitHub token and all credentials **never reach the browser**.

---

## STEP 1 — Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
   (Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token)

2. Fill in:
   - **Note:** `Ethiopost Connect Sync`
   - **Expiration:** No expiration (or 1 year)
   - **Scopes:** Check ✅ `repo` (the top-level one — it includes all sub-options)

3. Click **Generate token**

4. **Copy the token immediately** — it starts with `ghp_` and you only see it once.
   Save it somewhere safe (e.g. a notepad).

---

## STEP 2 — Push your code to GitHub

Open a terminal in the project folder and run these commands:

```bash
# Go into the project folder (the one extracted from the zip)
cd EthiopostConnect_fixed

# Initialize git
git init

# Stage all files
git add .

# First commit
git commit -m "Initial commit — EthiopostConnect"

# Connect to your GitHub repo (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/EthiopostConnect.git

# Rename branch to main and push
git branch -M main
git push -u origin main
```

> If GitHub asks for a password, use your GitHub token (ghp_xxx...) as the password.

---

## STEP 3 — Deploy on Vercel

### 3a. Import your repository

1. Go to https://vercel.com and sign in
2. Click **"Add New Project"**
3. Click **"Import"** next to your `EthiopostConnect` repository
4. Leave all build settings as default (Vercel will detect Vite automatically)

### 3b. Add Environment Variables

**Before clicking Deploy**, scroll down to **"Environment Variables"** and add these 3 variables:

| Name | Value |
|------|-------|
| `GITHUB_TOKEN` | `ghp_your_token_from_step_1` |
| `GITHUB_REPO` | `your-username/EthiopostConnect` |
| `GITHUB_BRANCH` | `main` |

> Make sure to select **Production**, **Preview**, and **Development** for each variable.

### 3c. Deploy

Click **"Deploy"**. Wait about 2 minutes.

You'll get a live URL like: `https://ethiopost-connect-xxx.vercel.app` ✅

---

## STEP 4 — Verify it works

1. Open your Vercel URL
2. You should see the **login page**
3. Log in with your credentials
4. Look at the top-right header — the **cloud icon** should show "Synced"
5. After any action (creating a task, etc.), the icon will briefly spin then show green ✅

### Check the API directly

Open this in your browser (replace with your domain):
```
https://your-app.vercel.app/api/state
```
First time: `{"ok":true,"state":null,"version":0}` — that's correct, it seeds on first login.
After login: `{"ok":true,"state":{...},"version":1}`

### Check data is in GitHub

Go to your GitHub repo → you'll see a new folder `data/` with `state.json` inside.
This is your live database file.

---

## STEP 5 — Future deploys (automatic)

Every time you push code:
```bash
git add .
git commit -m "Fix: updated feature"
git push
```
Vercel automatically redeploys in ~60 seconds.

---

## Troubleshooting

### Build fails: "Cannot find module './routeTree.gen'"
The generated routes file wasn't committed. Fix:
```bash
git add src/routeTree.gen.ts
git commit -m "Add generated routes"
git push
```

### Sync shows "Error" in the app header
Check that `GITHUB_TOKEN`, `GITHUB_REPO`, and `GITHUB_BRANCH` are all set:
- Vercel → Your Project → Settings → Environment Variables
- Make sure no leading/trailing spaces in the values
- After changing env vars, go to Deployments → Redeploy

### "GITHUB_TOKEN and GITHUB_REPO are not configured"
The env vars haven't been picked up. Trigger a fresh deploy:
Vercel → Deployments → click `···` on the latest → **Redeploy**

### Login doesn't work after first deploy
The store seeds from `src/lib/seed.ts`. If localStorage has stale data:
- Open DevTools (F12) → Application → Local Storage → Delete all → Refresh

### Token expired or revoked
Generate a new token at https://github.com/settings/tokens
Update `GITHUB_TOKEN` in Vercel env vars → Redeploy

---

## Local development

```bash
# Install dependencies
npm install

# Create a local env file (never commit this)
cp .env.example .env.local
# Edit .env.local and fill in your real GITHUB_TOKEN and GITHUB_REPO

# Start dev server
npm run dev
```

> Note: `/api/state` calls won't work locally unless you run `npx vercel dev`.
> For local testing, the app falls back gracefully — data is still saved in localStorage.

