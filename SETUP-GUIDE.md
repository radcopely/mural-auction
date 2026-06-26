# Mural Festival Auction — Deployment Guide

This guide takes you from zero to a live auction website. Total time: **1–2 hours**.

---

## What you'll need

- A computer with internet access
- A free GitHub account → github.com
- A free Supabase account → supabase.com (database)
- A free Vercel account → vercel.com (hosting)
- Node.js installed on your computer → nodejs.org (download the LTS version)

---

## PART 1 — Install Node.js (if you haven't already)

1. Go to **nodejs.org**
2. Download the **LTS** version (the green button)
3. Run the installer — click through all the defaults
4. To verify it worked, open **Terminal** (Mac) or **Command Prompt** (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. If so, you're good.

---

## PART 2 — Set up your Supabase database

Supabase is a free database service. This is where all your mural data and bids will live permanently.

### 2a. Create a Supabase account and project

1. Go to **supabase.com** and click **Start your project**
2. Sign up with GitHub (easiest) or email
3. Click **New project**
4. Fill in:
   - **Name:** `mural-auction` (or anything you like)
   - **Database password:** choose a strong password and **save it somewhere** (you won't need it often but don't lose it)
   - **Region:** pick the one closest to you (e.g. US East)
5. Click **Create new project** — it takes about 1 minute to spin up

### 2b. Run the database setup script

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase-setup.sql` from this project folder
4. Copy **all** the contents and paste them into the SQL Editor
5. Click the green **Run** button
6. You should see: `Success. No rows returned`

Your database now has two tables: **murals** and **bids**.

### 2c. Copy your Supabase credentials

1. In Supabase, click **Project Settings** (gear icon, bottom of left sidebar)
2. Click **API**
3. You'll see two values you need — copy them somewhere (Notepad, Notes app, etc.):
   - **Project URL** — looks like `https://abcdefghij.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## PART 3 — Set up the project on your computer

### 3a. Get the project files

You have a folder called `mural-auction` with all the code files. Put it somewhere easy to find, like your Desktop or Documents folder.

### 3b. Open Terminal / Command Prompt in the project folder

**Mac:**
1. Open **Terminal** (search for it in Spotlight)
2. Type `cd ` (with a space after), then drag the `mural-auction` folder into the Terminal window — it'll fill in the path automatically
3. Press Enter

**Windows:**
1. Open the `mural-auction` folder in File Explorer
2. Click in the address bar at the top, type `cmd`, press Enter
3. A Command Prompt window opens already inside the folder

### 3c. Install dependencies

In your Terminal / Command Prompt, type:
```
npm install
```
Wait for it to finish (may take 30–60 seconds). You'll see a lot of text scroll by — that's normal.

### 3d. Create your environment file

1. In the `mural-auction` folder, find the file called `.env.example`
2. Make a **copy** of it
3. Rename the copy to `.env.local` (exactly that, with the dot at the start)
4. Open `.env.local` in any text editor (Notepad, TextEdit, VS Code, etc.)
5. Fill in your values:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your long key here...
VITE_ADMIN_PASSWORD=choose-a-password-for-your-admin-panel
```

Replace the placeholder values with the ones you copied from Supabase in step 2c.
Choose any password you want for `VITE_ADMIN_PASSWORD` — this is what you'll type to access the admin panel on your live site.

6. Save the file.

> ⚠️ **Important:** `.env.local` is in `.gitignore` and will NOT be uploaded to GitHub. Your credentials stay private.

### 3e. Test it locally

In Terminal, type:
```
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open your browser and go to **http://localhost:5173** — you should see the auction site. If there's a connection error message, double-check your `.env.local` file for typos.

Press `Ctrl+C` in Terminal to stop the local server when you're done testing.

---

## PART 4 — Put the code on GitHub

GitHub is where your code lives online. Vercel will pull from it to build your site.

### 4a. Create a GitHub account (if you don't have one)

Go to **github.com** and sign up. Free account is all you need.

### 4b. Create a new repository

1. Log into GitHub
2. Click the **+** icon (top right) → **New repository**
3. Name it `mural-auction`
4. Leave it **Public** (required for free Vercel)
5. Do **NOT** check "Initialize with README" — leave everything unchecked
6. Click **Create repository**

### 4c. Install Git (if needed)

Open Terminal and type `git --version`. If you see a version number, you're good. If not:
- **Mac:** It'll prompt you to install developer tools — click Install
- **Windows:** Download from **git-scm.com**

### 4d. Push your code to GitHub

GitHub will show you commands after you create the repo. Use these (replace `YOUR_USERNAME` with your GitHub username):

```bash
git init
git add .
git commit -m "Initial commit: mural auction site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mural-auction.git
git push -u origin main
```

Type these one line at a time in Terminal. When you push, it may ask for your GitHub username and password. For the password, use a **Personal Access Token** (not your account password):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
2. Check the `repo` scope, generate, copy the token
3. Use that as your password when prompted

Refresh your GitHub repository page — you should see all your files there.

---

## PART 5 — Deploy on Vercel

Vercel will host your site for free and automatically rebuild it whenever you push code changes.

### 5a. Create a Vercel account

Go to **vercel.com** and sign up with your GitHub account (click "Continue with GitHub").

### 5b. Import your project

1. On the Vercel dashboard, click **Add New… → Project**
2. Find `mural-auction` in the list and click **Import**
3. Vercel auto-detects that it's a Vite project — the settings should be correct already
4. **Before deploying**, click **Environment Variables** and add your three variables:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_ADMIN_PASSWORD` | your chosen admin password |

5. Click **Deploy**

Vercel will build and deploy your site in about 60 seconds.

### 5c. Your site is live!

When it finishes, Vercel gives you a URL like `https://mural-auction-xyz.vercel.app`. That's your live auction site — share it with anyone.

---

## PART 6 — Using the site

### Adding murals (before/during the festival)

1. Go to your live site
2. Click **Admin ⚙** in the top bar
3. Enter your admin password
4. In the sidebar, click **+ Add** to create a new mural
5. Fill in the title, artist name, description, starting bid, and auction end date
6. Add progress photo URLs (see below)
7. Click **Save Changes**

### Adding progress photos during the festival

The simplest free way to add photos:
1. Take a photo on your phone
2. Upload it to **Google Drive**, **Dropbox**, or **imgur.com**
3. Get a direct link to the image file
4. In the Admin panel, paste the URL into the Photos section for that mural
5. Save — it appears on the site instantly

> **Imgur tip:** Go to imgur.com, upload your photo, right-click the image → "Copy image address" — that's a direct URL you can paste straight in.

### Updating status during painting

As each artist progresses:
- Set status to **In Progress** when they start painting
- Set status to **Complete** when they finish
- Keep adding photos throughout — bidders love seeing the progress

### After the auction ends

Bidder emails are stored in Supabase. To see all winning bids:
1. Go to your Supabase dashboard
2. Click **Table Editor** → **bids**
3. Sort by `amount` descending per mural
4. The top bid per mural is your winner — email them directly

---

## Troubleshooting

**Site shows "Connection error"**
→ Check your Vercel environment variables. Make sure there are no extra spaces in the values.

**Admin panel won't open**
→ Make sure `VITE_ADMIN_PASSWORD` in Vercel matches what you're typing. Redeploy after changing env vars.

**Photos not showing**
→ The URL must link directly to the image file (ending in .jpg, .png, etc.), not a webpage. Imgur, Google Photos shared links, and Dropbox direct links all work well.

**Bids aren't appearing in real-time**
→ Refresh the page. Real-time works when the Supabase Realtime feature is enabled (the SQL script enables it automatically).

**Changes to the code not showing on the live site**
→ After you push to GitHub, Vercel rebuilds automatically in about 60 seconds. Check the Vercel dashboard for build status.

---

## Making changes to the site later

If you want to update anything (change the festival name, colors, etc.):
1. Edit the files on your computer
2. In Terminal: `git add . && git commit -m "describe your change" && git push`
3. Vercel auto-deploys within a minute

---

## Costs

Everything used in this guide is **free**:
- GitHub: free for public repos
- Supabase: free tier handles up to 500MB storage and 2GB bandwidth — more than enough for an auction
- Vercel: free tier handles up to 100GB bandwidth per month

You only need to pay if the site gets enormous traffic (very unlikely for a local festival).
