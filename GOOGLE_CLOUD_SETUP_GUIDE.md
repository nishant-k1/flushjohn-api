# Google Cloud Speech-to-Text Setup Guide

This guide will walk you through getting all the required Google Cloud credentials for Speech-to-Text API with speaker diarization.

## Prerequisites

- A Google account (Gmail account works)
- Access to create a Google Cloud project (free tier available)

## Step-by-Step Instructions

### Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top (next to "Google Cloud")
   - Click "New Project"
   - Enter a project name (e.g., "FlushJohn Speech API")
   - Optionally change the Project ID (auto-generated, can be customized)
   - Click "Create"

3. **Select Your Project**
   - Make sure your newly created project is selected in the project dropdown

### Step 2: Enable Billing (Required)

**Note:** Google Cloud requires a billing account to use APIs, BUT you get $300 free credits for new accounts, and Speech-to-Text has a free tier (first 60 minutes/month free).

1. **Navigate to Billing**
   - In the left sidebar, click "Billing"
   - Click "Link a billing account" or "Create billing account"

2. **Create Billing Account**
   - Enter your account information
   - Add a payment method (required but won't be charged unless you exceed free credits)
   - Complete the setup

3. **Link to Project**
   - Select your project from the dropdown
   - Click "Set account"

### Step 3: Enable Speech-to-Text API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" > "Library"
   - Or visit: https://console.cloud.google.com/apis/library

2. **Search for Speech-to-Text API**
   - In the search bar, type "Cloud Speech-to-Text API"
   - Click on "Cloud Speech-to-Text API" from the results

3. **Enable the API**
   - Click the "Enable" button
   - Wait for the API to be enabled (usually takes 1-2 minutes)

### Step 4: Create a Service Account

1. **Navigate to Service Accounts**
   - In the left sidebar, click "IAM & Admin" > "Service Accounts"
   - Or visit: https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Create Service Account**
   - Click "+ Create Service Account" at the top
   - Enter details:
     - **Service account name**: `speech-to-text-service` (or any name you prefer)
     - **Service account ID**: Auto-filled based on name (can be customized)
     - **Description**: "Service account for Speech-to-Text API access"
   - Click "Create and Continue"

3. **Grant Roles**
   - In "Grant this service account access to project":
   - Click "Select a role" dropdown
   - Search for "Cloud Speech-to-Text API User"
   - Select "Cloud Speech-to-Text API User" role
   - Click "Continue"

4. **Skip User Access** (Optional)
   - You can skip granting users access to this service account
   - Click "Done"

### Step 5: Create and Download Service Account Key

1. **Open Your Service Account**
   - In the Service Accounts list, click on the service account you just created

2. **Navigate to Keys Tab**
   - Click the "Keys" tab at the top

3. **Create New Key**
   - Click "Add Key" > "Create new key"
   - Select "JSON" as the key type
   - Click "Create"

4. **Download the Key File**
   - The JSON file will automatically download to your computer
   - **IMPORTANT:** Keep this file secure! It contains credentials that can access your Google Cloud resources.
   - The file will look like: `your-project-id-xxxxx-xxxxx.json`

### Step 6: Secure Your Credentials File

**DO NOT commit this file to Git!**

1. **Move the file to a secure location**
   - Recommended location: `/path/to/your/project/credentials/` (outside of your project directory)
   - Or: `~/.config/google-cloud/` (your home directory)

2. **Add to .gitignore** (if keeping in project directory)
   ```gitignore
   # Google Cloud credentials
   *.json
   credentials/
   service-account-key.json
   ```

3. **Set proper file permissions** (Linux/Mac)
   ```bash
   chmod 600 /path/to/your-service-account-key.json
   ```

### Step 7: Configure Environment Variable

Choose one of these methods:

#### Option A: Environment Variable (Recommended for Development)

**Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/your-service-account-key.json"
```

**Windows (Command Prompt):**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\absolute\path\to\your-service-account-key.json
```

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\absolute\path\to\your-service-account-key.json"
```

#### Option B: .env File (Recommended for Production)

1. **Create or edit `.env` file** in your backend project root (`/Users/nishantkumar/dev/flushjohn-api/.env`)

2. **Add the path:**
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/your-service-account-key.json
   ```

3. **Ensure .env is in .gitignore:**
   ```gitignore
   .env
   ```

#### Option C: Production Hosting (Vercel, AWS, etc.)

For production deployments:

1. **Upload the JSON file securely** to your hosting platform
2. **Set environment variable** in your hosting platform's dashboard:
   - Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
   - Variable value: `/path/to/uploaded/key.json` OR base64-encoded content

   **For some platforms (like Vercel):**
   - You may need to use a different approach (store as secret, use environment variables with base64 encoding, etc.)
   - Check your platform's documentation for best practices

### Step 8: Verify the Setup

1. **Restart your backend server** to load the new environment variable

2. **Test the configuration:**
   ```bash
   curl http://localhost:8080/api/sales-assist/speech/status
   ```
   
   Or use Postman/your API client with authentication headers

   Expected response:
   ```json
   {
     "success": true,
     "configured": true,
     "message": "Google Cloud Speech-to-Text is configured"
   }
   ```

3. **Check server logs** for any initialization errors

## Quick Reference: File Locations

- **Service Account Key**: `/path/to/your-service-account-key.json`
- **Backend .env**: `/Users/nishantkumar/dev/flushjohn-api/.env`
- **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS`

## Troubleshooting

### Error: "Google Cloud Speech client not initialized"

**Solutions:**
1. Check that `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
2. Verify the path is absolute (not relative)
3. Ensure the JSON file exists at that path
4. Check file permissions (should be readable)

### Error: "Permission denied"

**Solutions:**
1. Verify the service account has "Cloud Speech-to-Text API User" role
2. Check that billing is enabled for the project
3. Ensure the API is enabled

### Error: "API not enabled"

**Solutions:**
1. Go to APIs & Services > Library
2. Search for "Cloud Speech-to-Text API"
3. Click "Enable"

### File Not Found

**Solutions:**
- Use absolute paths, not relative paths
- On Windows, use forward slashes or escape backslashes: `C:/path/to/file.json`
- Verify the file exists: `ls /path/to/file.json` (Linux/Mac) or `dir C:\path\to\file.json` (Windows)

## Cost Information

- **Free Tier**: First 60 minutes per month free
- **After Free Tier**: $0.016 per minute
- **Speaker Diarization**: Included at no extra cost
- **Estimated Monthly Cost**: 
  - 100 calls (10 min each) = ~$16/month
  - 500 calls (10 min each) = ~$80/month

## Security Best Practices

1. ✅ **Never commit credentials to Git**
2. ✅ **Use environment variables, not hardcoded paths**
3. ✅ **Restrict file permissions** (chmod 600)
4. ✅ **Rotate keys periodically**
5. ✅ **Use different service accounts for dev/staging/production**
6. ✅ **Monitor usage in Google Cloud Console**

## Additional Resources

- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Service Accounts Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Authentication Documentation](https://cloud.google.com/docs/authentication)

## Next Steps

Once you've completed these steps:

1. ✅ Restart your backend server
2. ✅ Test the `/api/sales-assist/speech/status` endpoint
3. ✅ Try the Sales Assist feature in your CRM
4. ✅ Monitor usage in Google Cloud Console

---

**Need Help?** Check the server logs for detailed error messages, or refer to the main README_GOOGLE_CLOUD_SPEECH.md file.
