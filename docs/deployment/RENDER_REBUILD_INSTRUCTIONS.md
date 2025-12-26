# Render Rebuild Instructions - Fix SOX Error

## Current Issue

You're getting the SOX error because Render hasn't rebuilt your service with the updated Dockerfile that includes SOX installation.

## Solution: Manually Trigger Rebuild on Render

### Step 1: Go to Render Dashboard

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Navigate to your **flushjohn-api** service

### Step 2: Trigger Manual Rebuild

**Option A: Manual Deploy (Recommended)**

1. Click on your service
2. Go to the **"Manual Deploy"** section (usually at the top)
3. Click **"Deploy latest commit"** or **"Clear build cache & deploy"**
4. This will rebuild the Docker image with SOX installed

**Option B: Push a New Commit (Alternative)**
If manual deploy doesn't work:

```bash
cd /Users/nishantkumar/dev/flushjohn-api
# Make a small change to trigger rebuild
echo "# Rebuild trigger" >> .gitignore
git add .gitignore
git commit -m "Trigger Render rebuild for SOX installation"
git push
```

### Step 3: Monitor Build Logs

1. In Render dashboard, go to **"Events"** or **"Logs"** tab
2. Watch for the build process
3. Look for this line in the logs:
   ```
   SoX v14.4.2 or similar version output
   ```
4. This confirms SOX was installed during the Docker build

### Step 4: Verify Deployment

After deployment completes:

1. Test the Sales Assist feature
2. The SOX error should be gone
3. Audio capture should work

## If Using Render Without Docker

If your Render service is **NOT** using Docker, you need to:

### Option 1: Switch to Docker (Recommended)

1. Go to Render service settings
2. Change deployment method to **"Docker"**
3. Set Dockerfile path to: `Dockerfile`
4. Save and redeploy

### Option 2: Add Build Command

1. Go to service → **Settings** → **Build Command**
2. Add:
   ```bash
   apt-get update && apt-get install -y sox && npm install
   ```
3. Save and redeploy

**Note:** Build commands may not work on all Render plans. Docker is recommended.

## Troubleshooting

### If SOX still not found after rebuild:

1. **Check Build Logs:**

   - Look for: `apt-get install -y sox`
   - Look for: `sox --version` output
   - If these are missing, Dockerfile isn't being used

2. **Verify Dockerfile is Being Used:**

   - Go to service → **Settings**
   - Check **"Dockerfile Path"** is set to `Dockerfile`
   - Check **"Docker Context"** is set to root directory

3. **Check PATH:**

   - SOX should be installed at `/usr/bin/sox`
   - The code checks with `which sox` which should find it

4. **Force Rebuild:**
   - In Render dashboard, use **"Clear build cache & deploy"**
   - This ensures a fresh build

## Current Status

✅ **Dockerfile updated** - Includes SOX installation
✅ **Committed and pushed** - Changes are in Git
⏳ **Action Required** - Manually trigger rebuild on Render

---

**Next Step:** Go to Render dashboard and trigger a manual rebuild!
