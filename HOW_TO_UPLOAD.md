# How to upload to GitHub (one time only)

You only need to do this once. After that, the app is live forever.

## Option A — GitHub Desktop (easiest, no terminal)

1. Download GitHub Desktop: https://desktop.github.com
2. Open it → File → Add Local Repository → choose this folder
3. If it says "not a git repo", click "Initialize Repository"
4. Click "Publish repository" → choose your account → name it `Marketing-BD-system`
5. Done ✅

## Option B — Terminal

Open a terminal in this folder and paste these lines one by one:

```
git init
git add .
git commit -m "Deploy EthiopostConnect"
git branch -M main
git remote add origin https://github.com/ethiopostsocial-rgb/Marketing-BD-system.git
git push -u origin main
```

When asked for password, use your GitHub Personal Access Token.

## After upload

Vercel auto-detects the push and deploys within 2 minutes.
Your app will be live at your Vercel URL.
