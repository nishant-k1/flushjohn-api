# SOX Installation for Render Deployment

## Problem
When deploying to Render, you're getting the error:
```
Aggregate audio capture failed. [SOX_NOT_INSTALLED] Sox audio tool is not installed or not in PATH.
```

## Solution

### Option 1: Dockerfile (Recommended) ✅
The Dockerfile has been updated to install SOX automatically. If you're using Docker on Render:

1. **The Dockerfile is already updated** - it now includes:
   ```dockerfile
   RUN apt-get update && \
       apt-get install -y sox && \
       apt-get clean && \
       rm -rf /var/lib/apt/lists/* && \
       sox --version
   ```

2. **Redeploy on Render:**
   - Push your changes to Git
   - Render will automatically rebuild with SOX installed
   - The deployment should now include SOX

### Option 2: Build Command (If not using Docker)
If you're using Render's build command instead of Docker:

1. **Update your Render build command:**
   ```bash
   apt-get update && apt-get install -y sox && npm install && npm start
   ```

2. **Or add to package.json scripts:**
   ```json
   {
     "scripts": {
       "preinstall": "apt-get update && apt-get install -y sox || echo 'SOX install skipped'",
       "start": "node ./app.js"
     }
   }
   ```

### Option 3: Render Environment Setup
If using Render's native environment (not Docker):

1. Go to your Render service dashboard
2. Navigate to **Environment** tab
3. Add a **Build Command:**
   ```bash
   apt-get update && apt-get install -y sox && npm install
   ```

**Note:** This may not work on all Render plans. Docker is recommended.

## Verification

After deployment, verify SOX is installed:

1. **SSH into your Render instance** (if available)
2. Run: `sox --version`
3. Should output: `SoX v14.4.2` or similar

Or check in your application logs - the Dockerfile now verifies SOX installation during build.

## Dockerfile Changes Made

The Dockerfile now includes:
```dockerfile
# Install SOX (Sound eXchange) for audio capture
RUN apt-get update && \
    apt-get install -y sox && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    sox --version
```

This:
- Updates package lists
- Installs SOX
- Cleans up apt cache (reduces image size)
- Verifies installation

## Next Steps

1. **Commit and push the updated Dockerfile:**
   ```bash
   git add Dockerfile
   git commit -m "Add SOX installation for audio capture"
   git push
   ```

2. **Render will automatically rebuild** with SOX installed

3. **Test the speech recognition feature** - the SOX error should be resolved

## Troubleshooting

### If SOX still not found after deployment:

1. **Check Render logs** during build - look for SOX installation
2. **Verify Dockerfile is being used** - check Render service settings
3. **Check PATH** - SOX should be in `/usr/bin/sox` (default)

### Alternative: Use system audio capture without SOX
If SOX installation fails, you can modify the backend to use frontend-only audio capture (no Aggregate Device). This requires code changes in `aggregateAudioCapture.js`.

---

**Status:** Dockerfile updated ✅
**Action Required:** Commit, push, and redeploy on Render

