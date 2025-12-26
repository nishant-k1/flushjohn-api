# Sales Assist & Vendor Assist Architecture

## Overview

Sales Assist and Vendor Assist are AI-powered conversation assistants that provide real-time transcription and response suggestions during phone calls. They use Google Cloud Speech-to-Text for transcription and OpenAI for AI analysis and response generation.

## Key Components

### 1. **Frontend (CRM)**
- **Location**: `flushjohn-crm/src/features/salesAssist/`
- **Main Components**:
  - `SalesAssistModal` - UI for sales conversations (FJ Rep ↔ Lead)
  - `VendorAssistModal` - UI for vendor conversations (FJ Rep ↔ Vendor Rep)
  - `useGoogleSpeechRecognition` hook - Handles audio capture and WebSocket communication

### 2. **Backend (API)**
- **Location**: `flushjohn-api/features/salesAssist/`
- **Main Services**:
  - `googleSpeechService.js` - Google Cloud Speech-to-Text integration
  - `salesAssistService.js` - AI analysis and response generation
  - `speechRecognition.js` (socket handler) - WebSocket handler for real-time audio streaming
  - `aggregateAudioCapture.js` - Backend audio capture (macOS only, optional)

---

## Complete Flow: What Happens When You Open Sales Assist

### Step 1: User Opens Sales Assist Modal

```
User clicks "Sales Assist" button
  ↓
SalesAssistModal component mounts
  ↓
useGoogleSpeechRecognition hook initializes with mode="sales"
```

**Files Involved**:
- `flushjohn-crm/src/features/salesAssist/components/SalesAssistModal/index.js`
- `flushjohn-crm/src/hooks/useGoogleSpeechRecognition.js`

---

### Step 2: User Starts Recording (Press Space or Click Mic Button)

```
User clicks microphone button or presses Space
  ↓
startListening() is called
  ↓
Frontend requests microphone permission
  ↓
Frontend attempts to find BlackHole device (system audio)
```

**What Happens in Frontend** (`useGoogleSpeechRecognition.js`):

1. **Microphone Capture**:
   ```javascript
   const micStream = await navigator.mediaDevices.getUserMedia({
     audio: {
       channelCount: 1,      // Mono
       sampleRate: 16000,    // 16kHz
       echoCancellation: true,
       noiseSuppression: true,
     },
   });
   ```

2. **BlackHole Device Detection** (for system audio):
   ```javascript
   // Searches for BlackHole device in available audio inputs
   const blackHoleDeviceId = await findBlackHoleDevice();
   if (blackHoleDeviceId) {
     // Captures system audio (phone call audio)
     blackHoleStream = await navigator.mediaDevices.getUserMedia({
       audio: { deviceId: { exact: blackHoleDeviceId } }
     });
   }
   ```

3. **Audio Processing Setup**:
   - Creates `AudioContext` at 16kHz
   - Sets up `ScriptProcessor` nodes to process audio chunks
   - Converts Float32Array → Int16Array (LINEAR16 PCM format)
   - Encodes to base64 for transmission

---

### Step 3: WebSocket Connection Established

```
Frontend connects to backend via Socket.io
  ↓
Socket connects to /speech-recognition namespace
  ↓
Backend authenticates using JWT token
  ↓
Frontend emits "start-recognition" with mode="sales"
```

**WebSocket Connection**:
```javascript
const socket = io(`${apiUrl}/speech-recognition`, {
  transports: ["websocket"],
  auth: { token: localStorage.getItem("authToken") }
});

socket.emit("start-recognition", { mode: "sales" });
```

**Backend Handler** (`speechRecognition.js`):
- Receives `start-recognition` event
- Creates two separate Google Speech-to-Text streams:
  - **Operator Stream**: For microphone audio (FJ Rep)
  - **Customer Stream**: For BlackHole/system audio (Lead/Vendor Rep)

---

### Step 4: Audio Streaming to Backend

**Frontend → Backend**:
```
Audio chunks processed every 4096 samples
  ↓
Converted to LINEAR16 PCM (Int16Array)
  ↓
Encoded to base64
  ↓
Sent via WebSocket: socket.emit("audio-chunk", {
  audioData: base64Audio,
  format: "LINEAR16",
  sampleRate: 16000,
  audioSource: "input_audio" | "output_audio"
})
```

**Backend Receives Audio** (`speechRecognition.js`):
```javascript
socket.on("audio-chunk", (data) => {
  const audioBuffer = Buffer.from(data.audioData, "base64");
  
  if (data.audioSource === "input_audio") {
    operatorStream.write(audioBuffer);  // → Google Speech API
  } else if (data.audioSource === "output_audio") {
    customerStream.write(audioBuffer);   // → Google Speech API
  }
});
```

---

### Step 5: Google Speech-to-Text Transcription

**Backend → Google Cloud Speech API**:

1. **Stream Creation** (`googleSpeechService.js`):
   ```javascript
   const recognizeStream = speechClient.streamingRecognize({
     config: {
       encoding: "LINEAR16",
       sampleRateHertz: 16000,
       languageCode: "en-US",
       model: "phone_call",
       enableAutomaticPunctuation: true,
       diarizationConfig: {
         enableSpeakerDiarization: true,
         minSpeakerCount: 2,
         maxSpeakerCount: 2,
       }
     },
     interimResults: true  // Get real-time partial results
   });
   ```

2. **Transcript Results**:
   - **Interim Results**: Partial transcripts (shown in real-time)
   - **Final Results**: Complete sentences (used for AI analysis)

3. **Speaker Identification**:
   - **Source-Based**: Uses `audioSource` tag from frontend
     - `audioSource: "input_audio"` → Always labeled as "FJ Rep"
     - `audioSource: "output_audio"` → Labeled as "Lead" (sales mode) or "Vendor Rep" (vendor mode)
   - **Note**: Google's speaker diarization is available but not relied upon (source-based is more accurate)

---

### Step 6: Transcript Sent to Frontend

**Backend → Frontend**:
```javascript
// When final transcript received from Google
socket.emit("transcript", {
  transcript: "Hello, I need porta potties",
  isFinal: true,
  audioSource: "output_audio",  // or "input_audio"
  confidence: 0.95
});
```

**Frontend Updates UI**:
```javascript
socket.on("transcript", (data) => {
  if (data.isFinal) {
    // Determine speaker label based on mode and audioSource
    const speakerLabel = data.audioSource === "input_audio" 
      ? "FJ Rep" 
      : (mode === "vendor" ? "Vendor Rep" : "Lead");
    
    // Append to transcript
    setTranscript(prev => 
      `${prev}\n[${speakerLabel}]: ${data.transcript}`
    );
  } else {
    // Interim result (partial transcript)
    setInterimTranscript(data.transcript);
  }
});
```

---

### Step 7: AI Analysis & Response Generation

**Trigger**: When customer/lead speaks (final transcript received)

**Backend Process** (`speechRecognition.js` → `salesAssistService.js`):

1. **Conversation Analysis**:
   ```javascript
   const analysisResult = await salesAssistService.analyzeConversation(
     fullTranscript,
     { mode: "sales" }
   );
   ```
   - Extracts: location, eventType, quantity, dates, intent, etc.
   - Uses OpenAI GPT-4o-mini with structured JSON output

2. **Response Generation**:
   ```javascript
   const responseResult = await salesAssistService.generateRealTimeResponse({
     transcript: fullTranscript,
     extractedInfo: analysisResult,
     mode: "sales"
   });
   ```
   - Generates suggested response for operator
   - Calculates pricing breakdown (if applicable)
   - Provides next action suggestions

3. **Response Sent to Frontend**:
   ```javascript
   socket.emit("operator-response", {
     response: "Oh yeah, we kin definitly help ya out with that...",
     pricingBreakdown: { /* pricing details */ },
     nextAction: "Ask about delivery address",
     confidence: "high",
     extractedInfo: analysisResult
   });
   ```

**Note**: AI responses are only generated when **customer/lead speaks**, not when operator speaks.

---

### Step 8: Frontend Displays AI Response

**Frontend Receives Response**:
```javascript
socket.on("operator-response", (data) => {
  setOperatorResponse({
    response: data.response,
    pricingBreakdown: data.pricingBreakdown,
    nextAction: data.nextAction
  });
});
```

**UI Updates**:
- Shows suggested response in a highlighted box
- Displays pricing breakdown (if calculated)
- Shows next action suggestion

---

### Step 9: Pronunciation Analysis (Sales Mode Only)

**Backend** (`pronunciationAnalysisService.js`):
- Analyzes operator speech for pronunciation quality
- Scores each segment (1-5 scale)
- Provides real-time feedback

**Frontend**:
- Displays pronunciation score indicator
- Shows summary panel with recommendations

---

### Step 10: Save Conversation

**User clicks "Save" button**:
```javascript
await saveConversation({
  outcome: "pending",
  feedback: null,
  aiHelpful: null
});
```

**Backend Process**:
1. Saves to database:
   - **Sales Mode**: `ConversationLog` collection
   - **Vendor Mode**: `VendorConversationLog` collection
2. Stores:
   - Full transcript
   - Extracted information
   - Pricing breakdown (if any)
   - Operator feedback
   - Duration
3. **Vendor Mode**: Triggers async AI learning extraction
   - Extracts effective phrases, negotiation tactics, pricing strategies

---

## Audio Capture Methods

### Method 1: Frontend Capture (Default)

**How It Works**:
- Frontend captures microphone audio directly
- Frontend captures BlackHole/system audio (if available)
- Both streams sent to backend via WebSocket

**Pros**:
- Works on any platform (Windows, macOS, Linux)
- No backend audio configuration needed
- Simpler setup

**Cons**:
- Requires BlackHole to be installed and configured on user's machine
- Depends on browser audio permissions

**Configuration**: No backend config needed (default mode)

---

### Method 2: Backend Aggregate Device (macOS Only, Optional)

**How It Works**:
- Backend captures audio from macOS Aggregate Device
- Aggregate Device combines:
  - Channel 1: Microphone (operator)
  - Channel 2: BlackHole 16ch (customer/system audio)
- Backend separates channels and routes to appropriate streams

**Pros**:
- More reliable audio capture
- Centralized audio configuration
- No frontend audio setup needed

**Cons**:
- macOS only (Aggregate Device is macOS-specific)
- Requires SOX audio tool installed
- Requires Aggregate Device configured in Audio MIDI Setup

**Configuration**:
```bash
USE_BACKEND_AUDIO_CAPTURE=true
AGGREGATE_AUDIO_DEVICE="Aggregate Device"
OPERATOR_AUDIO_CHANNEL=1
CUSTOMER_AUDIO_CHANNEL=2
```

---

## Speaker Identification

### Source-Based Identification (Current Method)

**How It Works**:
- Frontend tags audio chunks with `audioSource`:
  - Microphone → `audioSource: "input_audio"`
  - BlackHole → `audioSource: "output_audio"`
- Backend labels transcripts based on source:
  - `input_audio` → Always "FJ Rep"
  - `output_audio` → "Lead" (sales mode) or "Vendor Rep" (vendor mode)

**Why This Method**:
- More accurate than content-based detection
- No ambiguity about who is speaking
- Works regardless of conversation content

---

## Mode Differences

### Sales Mode (`mode: "sales"`)

**Speakers**:
- **FJ Rep** (operator): Provides pricing, answers questions
- **Lead** (customer): Asks for quotes, requests service

**AI Behavior**:
- Generates sales responses with pricing calculations
- Extracts customer requirements (location, dates, quantity)
- Calculates pricing breakdown with tax
- Provides closing suggestions

**Saved To**: `ConversationLog` collection

---

### Vendor Mode (`mode: "vendor"`)

**Speakers**:
- **FJ Rep** (operator): Asks for vendor quotes/pricing
- **Vendor Rep** (customer): Provides quotes/pricing

**AI Behavior**:
- Generates questions to gather vendor pricing
- Extracts vendor pricing information
- No pricing calculations (vendor provides pricing)
- Focuses on information gathering

**Saved To**: `VendorConversationLog` collection
- Also triggers AI learning extraction (effective phrases, tactics)

---

## Key Files Reference

### Frontend
- `flushjohn-crm/src/hooks/useGoogleSpeechRecognition.js` - Audio capture & WebSocket
- `flushjohn-crm/src/features/salesAssist/components/SalesAssistModal/index.js` - Sales UI
- `flushjohn-crm/src/features/salesAssist/components/VendorAssistModal/index.js` - Vendor UI

### Backend
- `flushjohn-api/features/salesAssist/sockets/speechRecognition.js` - WebSocket handler
- `flushjohn-api/features/salesAssist/services/googleSpeechService.js` - Google Speech API
- `flushjohn-api/features/salesAssist/services/salesAssistService.js` - AI analysis & responses
- `flushjohn-api/features/salesAssist/services/aggregateAudioCapture.js` - Backend audio capture

---

## Environment Variables

### Required
- `GOOGLE_CREDENTIALS_JSON` - Google Cloud Speech-to-Text credentials (JSON string)
- `OPENAI_API_KEY` - OpenAI API key for AI analysis

### Optional (Backend Audio Capture)
- `USE_BACKEND_AUDIO_CAPTURE=true` - Enable backend audio capture
- `AGGREGATE_AUDIO_DEVICE` - Aggregate Device name (macOS)
- `OPERATOR_AUDIO_CHANNEL` - Operator audio channel (default: 1)
- `CUSTOMER_AUDIO_CHANNEL` - Customer audio channel (default: 2)

---

## Stream Limits & Auto-Restart

**Google Speech API Limit**: 305 seconds per stream

**Auto-Restart Mechanism**:
- When either stream hits 305-second limit, both streams are automatically restarted
- Frontend continues sending audio (no interruption)
- Transcript continues accumulating seamlessly

**Implementation**: See `restartStreams()` function in `speechRecognition.js`

---

## Error Handling

### Common Issues

1. **BlackHole Not Found**:
   - Frontend continues with microphone only
   - Backend still processes operator audio
   - Customer audio won't be captured

2. **Google Speech Not Configured**:
   - Error shown in UI
   - Recording cannot start

3. **WebSocket Disconnection**:
   - Frontend attempts to reconnect
   - Transcript is preserved until reconnection

4. **Audio Permission Denied**:
   - Browser shows permission prompt
   - Recording cannot start until permission granted

---

## Summary Flow Diagram

```
User Opens Sales Assist
  ↓
Frontend: Request Mic + BlackHole Permission
  ↓
Frontend: Connect WebSocket to Backend
  ↓
Backend: Create 2 Google Speech Streams (operator + customer)
  ↓
[LOOP: During Call]
  Frontend: Capture Audio → Convert to PCM → Send via WebSocket
    ↓
  Backend: Receive Audio → Send to Google Speech API
    ↓
  Google Speech: Transcribe → Return Transcript
    ↓
  Backend: Tag with audioSource → Send to Frontend
    ↓
  Frontend: Display Transcript
    ↓
  [If Customer Speaks]
    Backend: Analyze with AI → Generate Response → Send to Frontend
    ↓
    Frontend: Display AI Response Suggestion
  ↓
[END LOOP]
  ↓
User Saves Conversation
  ↓
Backend: Save to Database → Trigger AI Learning (vendor mode)
```

---

This architecture provides real-time transcription, AI-powered assistance, and seamless audio capture for both sales and vendor conversations.

