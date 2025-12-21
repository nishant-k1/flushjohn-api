# Google Cloud Speech-to-Text Integration

This document explains how to set up and configure Google Cloud Speech-to-Text API with speaker diarization for the Sales Assist feature.

**For detailed step-by-step setup instructions, see [GOOGLE_CLOUD_SETUP_GUIDE.md](./GOOGLE_CLOUD_SETUP_GUIDE.md)**

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with Speech-to-Text API enabled
3. A service account with Speech-to-Text API permissions

## Setup Instructions

### 1. Enable Speech-to-Text API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Cloud Speech-to-Text API"
5. Click "Enable"

### 2. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Provide a name (e.g., "speech-to-text-service")
4. Grant role: "Cloud Speech-to-Text API User"
5. Click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select JSON format
5. Download the JSON key file

### 4. Configure Environment Variable

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your service account key file:

**Linux/Mac:**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

**Windows:**

```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\service-account-key.json
```

**In .env file (recommended):**

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

**For production (e.g., Vercel, AWS, etc.):**
Upload the service account key file securely and set the environment variable in your hosting platform's dashboard.

### 5. Verify Installation

The backend will automatically initialize the Google Cloud Speech client when the server starts. Check the logs for any initialization errors.

You can also test the configuration by calling:

```
GET /api/sales-assist/speech/status
```

This should return:

```json
{
  "success": true,
  "configured": true,
  "message": "Google Cloud Speech-to-Text is configured"
}
```

## Pricing

- **Base Rate:** $0.016 per minute of audio processed
- **Speaker Diarization:** Included at no extra cost
- **Free Tier:** First 60 minutes per month are free

## Features Enabled

- Real-time streaming transcription
- Automatic speaker diarization (Operator vs Customer)
- Enhanced model for phone calls
- Automatic punctuation
- High accuracy recognition

## Troubleshooting

### Error: "Google Cloud Speech client not initialized"

**Solution:** Ensure `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set correctly and points to a valid service account key file.

### Error: "Permission denied"

**Solution:** Ensure the service account has the "Cloud Speech-to-Text API User" role.

### Error: "API not enabled"

**Solution:** Enable the Cloud Speech-to-Text API in your GCP project.

### Microphone Permission Issues

**Solution:** Ensure users grant microphone permissions in their browser when prompted.

## Testing

1. Open the Sales Assist modal in the CRM
2. Click the microphone button
3. Grant microphone permissions when prompted
4. Start speaking - transcription should appear in real-time
5. Speaker labels (Operator/Customer) should automatically appear in the transcript

## Architecture

- **Frontend:** Captures audio via Web Audio API, converts to LINEAR16 PCM format
- **WebSocket:** Streams audio chunks to backend via Socket.io
- **Backend:** Receives audio chunks and streams to Google Cloud Speech-to-Text API
- **Speaker Diarization:** Automatically identifies speakers and labels transcript segments
- **Real-time Updates:** Transcript updates streamed back to frontend via WebSocket
