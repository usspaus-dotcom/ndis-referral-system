# Deployment Guide — Accurate Home Care NDIS Referral System

This guide walks you through deploying your independent site to **Render.com** for free in about 10–15 minutes.

---

## What You Need

- A free **GitHub** account (github.com)
- A free **Render** account (render.com)
- The ZIP file of this project

---

## Step 1 — Upload Code to GitHub

1. Go to **github.com** and sign in (or create a free account)
2. Click the **+** button (top right) → **New repository**
3. Name it: `ndis-referral-system`
4. Set it to **Private**
5. Click **Create repository**
6. On the next page, click **uploading an existing file**
7. Drag and drop all the files from this ZIP into the upload area
8. Click **Commit changes**

---

## Step 2 — Create Free Account on Render

1. Go to **render.com** and click **Get Started for Free**
2. Sign up with your GitHub account (easiest option)
3. Authorize Render to access your GitHub repositories

---

## Step 3 — Create PostgreSQL Database

1. In Render dashboard, click **New +** → **PostgreSQL**
2. Name: `ndis-db`
3. Database: `ndis_referral`
4. Region: **Singapore** (closest to Australia)
5. Plan: **Free**
6. Click **Create Database**
7. Wait 1–2 minutes for it to start
8. Copy the **Internal Database URL** — you'll need it in Step 4

---

## Step 4 — Deploy the Web Service

1. In Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository: `ndis-referral-system`
3. Fill in the settings:
   - **Name:** `ndis-referral-system`
   - **Region:** Singapore
   - **Branch:** main
   - **Build Command:** `npm install && cd client && npm install && npm run build && cd .. && npm run build:server`
   - **Start Command:** `npm run db:migrate && npm run db:seed && npm start`
   - **Plan:** Free

4. Add Environment Variables (click **Advanced** → **Add Environment Variable**):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 3)* |
   | `JWT_SECRET` | *(any random string, e.g., `ndis-secret-2024-xk9p2m`)* |
   | `ADMIN_EMAIL` | `accuratehomecare.cs@gmail.com` |
   | `ADMIN_PASSWORD` | `Sanjaya7777777$` |
   | `OPENAI_API_KEY` | *(optional — leave blank to disable AI features)* |
   | `FRONTEND_URL` | *(your Render URL, e.g., `https://ndis-referral-system.onrender.com`)* |

5. Click **Create Web Service**
6. Wait 3–5 minutes for the first build to complete

---

## Step 5 — Access Your Site

Once deployed, your site will be live at:
```
https://ndis-referral-system.onrender.com
```

- **Public site:** `https://ndis-referral-system.onrender.com`
- **Admin login:** `https://ndis-referral-system.onrender.com/login`
- **Analytics:** `https://ndis-referral-system.onrender.com/analytics`

**Login credentials:**
- Email: `accuratehomecare.cs@gmail.com`
- Password: `Sanjaya7777777$`

---

## Step 6 — Custom Domain (Optional)

If you have a domain (e.g., accuratehomecare.com.au):

1. In Render, go to your web service → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter your domain name
4. Render will give you DNS records to add to your domain registrar
5. Add those records in your domain registrar's DNS settings
6. Wait up to 24 hours for DNS to propagate

---

## Important Notes

### Free Tier Limitations
- The free tier **sleeps after 15 minutes of inactivity**
- First visit after sleep takes ~30 seconds to wake up
- To avoid this, upgrade to the **Starter plan ($7/month)**

### Keeping Your Data Safe
- The free PostgreSQL database is deleted after **90 days of inactivity**
- Log in at least once every 90 days to keep it active
- Or upgrade to a paid database plan for permanent storage

### Adding OpenAI (AI Features)
1. Go to **platform.openai.com** → API Keys → Create new key
2. In Render, go to your service → **Environment** → Add `OPENAI_API_KEY`
3. Redeploy the service

---

## Troubleshooting

**Site shows "Application Error":**
- Check the Render logs: Service → **Logs** tab
- Most common issue: wrong DATABASE_URL

**Can't log in:**
- Make sure ADMIN_EMAIL and ADMIN_PASSWORD match exactly
- The seed script runs automatically on first deploy

**Build fails:**
- Check the build logs in Render
- Most common issue: missing environment variables

---

## Support

For help with this system, contact the developer who built it.
For Render platform issues: render.com/docs
