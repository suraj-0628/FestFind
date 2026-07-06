# FestFind — Render Free + cron-job.org Deployment

## What You Need
- Render account: https://render.com (sign up with GitHub, no credit card)
- Name.com domain via Student Developer Pack
- cron-job.org account (free)

---

## Step 1: Push Code to GitHub

```bash
cd college-fest-site
git add .
git commit -m "Add Render deployment config"
git push origin main
```

---

## Step 2: Create Render Web Service

1. Go to https://render.com → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: `suraj-0628/FestFind`
4. Fill in:
   - **Name:** `festfind`
   - **Runtime:** Python
   - **Build Command:**
     ```
     cd frontend && npm install && npm run build && cp -r dist ../backend/static && cd ../backend && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
5. Click **Create Web Service**
6. Wait for build to complete (~3-5 min)

---

## Step 3: Set Environment Variables

In Render dashboard → your service → **Environment** tab:

| Key | Value |
|-----|-------|
| `JWT_SECRET` | Click "Generate" |
| `CORS_ORIGINS` | `https://festfind.onrender.com` |
| `APP_ENV` | `production` |

Save → service auto-redeploys.

---

## Step 4: Get Free Domain from Name.com

1. Go to https://www.name.com → GitHub Student Developer Pack
2. Register free `.live` domain (e.g., `festfind.live`)

---

## Step 5: Connect Domain to Render

1. Render dashboard → your service → **Settings** → **Custom Domains**
2. Add `festfind.live`
3. Render gives you a CNAME record value
4. In Name.com DNS:
   | Type | Host | Value |
   |------|------|-------|
   | CNAME | @ | `festfind.onrender.com` |
   | CNAME | www | `festfind.onrender.com` |
5. Wait ~5 min for SSL (auto-provisioned by Render)

---

## Step 6: Setup cron-job.org (Keep Alive)

1. Go to https://cron-job.org → Sign up (free)
2. Click **Create Job**
3. Fill in:
   - **Title:** `FestFind Keep Alive`
   - **URL:** `https://festfind.onrender.com/api/health`
   - **Schedule:** Every 5 minutes
   - **Request Method:** GET
4. Click **Save**

---

## Step 7: Verify

```bash
# Check site is live
curl -I https://festfind.onrender.com

# Check health endpoint
curl https://festfind.onrender.com/api/health
# Should return: {"status": "ok"}

# Visit in browser
open https://festfind.live
```

---

## How It Works

```
cron-job.org → pings /api/health every 5 min → Render stays awake
                                                    ↓
                                            Backend runs 24/7
                                            Scraper runs every 6hr
                                            Site never sleeps
```

---

## Future Updates

```bash
# Just push to GitHub — Render auto-deploys
git add . && git commit -m "Update" && git push origin main

# Or manually trigger deploy in Render dashboard
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check build logs in Render dashboard |
| Site sleeps despite cron | Increase frequency to every 3 min |
| Scraper not running | Check logs: Render dashboard → Logs |
| 403 on API | Update CORS_ORIGINS to include your domain |
| Domain not working | Wait 10 min, check DNS with `dig festfind.live` |
