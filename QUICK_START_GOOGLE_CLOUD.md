# Quick Start: Google Cloud Speech-to-Text Setup

**Time: ~10 minutes**

## TL;DR - Fastest Path

1. **Go to**: https://console.cloud.google.com/
2. **Create Project** → Name it (e.g., "FlushJohn Speech")
3. **Enable Billing** → Add payment method ($300 free credits + 60 min/month free)
4. **Enable API** → Search "Speech-to-Text API" → Click Enable
5. **Create Service Account** → IAM & Admin → Service Accounts → Create
   - Name: `speech-service`
   - Role: "Cloud Speech Client"
6. **Download Key** → Keys tab → Add Key → JSON → Download
7. **Set Environment Variable** (choose one):

   **For Production (recommended):**
   Copy the entire JSON file contents and set as environment variable:

   ```
   GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}
   ```

   **For Local Development:**

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/downloaded-key.json"
   ```

8. **Restart your server** → Test: `GET /api/sales-assist/speech/status`

## Detailed Guide

For complete step-by-step instructions with screenshots and troubleshooting, see:

- **[GOOGLE_CLOUD_SETUP_GUIDE.md](./GOOGLE_CLOUD_SETUP_GUIDE.md)** - Full detailed guide

## What You'll Get

After setup, you'll have:

- ✅ Real-time speech transcription
- ✅ Automatic speaker identification (Operator vs Customer)
- ✅ Free tier: 60 minutes/month free
- ✅ $0.016/minute after free tier
- ✅ Speaker diarization included (no extra cost)

## Need Help?

1. Check server logs for errors
2. Verify environment variable is set: `echo $GOOGLE_APPLICATION_CREDENTIALS`
3. Test endpoint: `curl http://localhost:8080/api/sales-assist/speech/status`
4. See troubleshooting section in [GOOGLE_CLOUD_SETUP_GUIDE.md](./GOOGLE_CLOUD_SETUP_GUIDE.md)
