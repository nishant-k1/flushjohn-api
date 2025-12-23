# Deploy to Render with SOX Support

## Quick Fix for SOX Error on Render

The Dockerfile has been updated to automatically install SOX during the Docker build process.

## Steps to Deploy

### 1. Commit and Push Changes
```bash
cd /Users/nishantkumar/dev/flushjohn-api
git add Dockerfile
git commit -m "Add SOX installation for Render deployment"
git push
```

### 2. Render Will Auto-Rebuild
- Render detects the push and automatically rebuilds
- The new build will include SOX installation
- Deployment should complete successfully

### 3. Verify Installation
After deployment, check the build logs in Render dashboard:
- Look for: `SoX v14.4.2` or similar version
- This confirms SOX was installed during build

## What Changed

The Dockerfile now includes:
```dockerfile
# Install SOX (Sound eXchange) for audio capture
RUN apt-get update && \
    apt-get install -y sox && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    sox --version
```

This installs SOX in the Docker container, which is what Render uses.

## If Using Render Without Docker

If you're not using Docker on Render, you'll need to:

1. **Add Build Command in Render Dashboard:**
   - Go to your service → Settings → Build Command
   - Add: `apt-get update && apt-get install -y sox && npm install`

2. **Or use a build script:**
   Create `build.sh`:
   ```bash
   #!/bin/bash
   apt-get update
   apt-get install -y sox
   npm install
   ```

## Testing

After deployment:
1. Test the Sales Assist feature
2. The SOX error should no longer appear
3. Audio capture should work properly

## Troubleshooting

### If error persists:
1. Check Render build logs for SOX installation
2. Verify Dockerfile is being used (check Render service settings)
3. Ensure the service is using Docker deployment method

### Alternative Solution:
If SOX installation fails, you can configure the backend to use frontend-only audio capture (no Aggregate Device). This requires modifying `aggregateAudioCapture.js` to skip SOX checks.

---

**Status:** ✅ Dockerfile updated and ready for deployment

