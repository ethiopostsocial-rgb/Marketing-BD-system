# Live Sync Setup

This app uses **GitHub** as the database — your state is stored as a JSON file
in your GitHub repository. No external database required.

## How it works

```
Any user makes a change
  └─ Zustand store updates (instant, local)
       └─ SyncProvider detects change (1.5s debounce)
            └─ POST /api/state  (Vercel serverless function)
                 └─ Writes data/state.json to GitHub repo

Another user opens the app (or every 30s)
  └─ GET /api/state
       └─ Reads data/state.json from GitHub
            └─ Applies latest data to their store
```

## Setup

See DEPLOY.md for full step-by-step instructions.

You need just 3 environment variables in Vercel:
- `GITHUB_TOKEN` — Personal Access Token with `repo` scope
- `GITHUB_REPO` — `your-username/your-repo`
- `GITHUB_BRANCH` — `main`

## Sync status badge

| Icon | Meaning |
|------|---------|
| ☁️ grey | Idle — last sync succeeded |
| 🔄 blue spinning | Pushing changes now |
| ✅ green | Just saved |
| ⚠️ red | Push failed — click to retry |
| 📵 amber | Offline — will retry when reconnected |

Click the badge at any time to force an immediate sync.

## Security

- `GITHUB_TOKEN` is server-side only — never exposed to the browser
- The data file in GitHub is only accessible to repo members
- Rotate the token if it is ever exposed
