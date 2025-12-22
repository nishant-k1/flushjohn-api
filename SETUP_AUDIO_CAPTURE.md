# Audio Capture Setup Guide (macOS)

This guide explains how to set up dual-channel audio capture for the Sales Assist and Vendor Assist features. The system captures audio from two sources:

- **Operator voice** (microphone) - captured via browser
- **Customer/Vendor voice** (phone.com) - captured via **browser tab audio** OR **system audio (BlackHole)**

## Two Setup Options - Both Supported!

The system automatically handles both Phone.com desktop app and web app. You can use either one, or switch between them.

### ✅ Option 1: Browser-Based Phone.com (Recommended - Easier Setup)

**If you use Phone.com's web app in a browser**, you can capture tab audio directly - **no additional software needed!**

**Note**: When you start tab audio capture, the system automatically stops system audio capture (if running) to avoid duplicate audio streams.

#### Quick Setup Steps:

1. **Start Recording**

   - Open Sales Assist or Vendor Assist modal in the CRM
   - Click the microphone button (or press Space) to start recording your voice
   - Open Phone.com in a browser tab and start your call

2. **Capture Tab Audio**

   - Once recording starts, you'll see a **desktop icon button** (🖥️) appear next to the microphone button
   - Click the desktop icon button
   - Your browser will prompt you to "Share" a tab - **select the Phone.com tab**
   - **Important**: Make sure to check **"Share tab audio"** in the browser prompt
   - The button will turn green when tab audio is being captured

3. **Verify It's Working**
   - You should see transcripts labeled:
     - `[FJ Rep]:` (your microphone)
     - `[Lead]:` or `[Vendor Rep]:` (Phone.com tab audio)

**That's it!** No BlackHole installation or system configuration needed for browser-based Phone.com.

---

### Option 2: Desktop App Phone.com (Advanced Setup)

**If you use Phone.com's desktop app**, you'll need BlackHole and system audio routing.

**Note**: System audio capture starts automatically when you begin recording. If you later start tab audio capture, system audio will automatically stop to prevent duplicates.

#### Prerequisites:

- macOS (tested on macOS 10.14+)
- Node.js installed
- Phone.com desktop app installed
- BlackHole virtual audio device installed

## Option 2: Desktop App Setup Steps

### Step 1: Install BlackHole Virtual Audio Device

BlackHole is a free, open-source virtual audio driver for macOS that allows you to capture system audio.

### Installation Steps:

1. **Download BlackHole**

   - Visit: https://github.com/ExistentialAudio/BlackHole
   - Download the latest release (**BlackHole 16ch is recommended** for better audio quality and more channels)

2. **Install BlackHole**

   - Open the downloaded `.pkg` file
   - Follow the installation wizard
   - You may need to allow the installation in System Preferences → Security & Privacy

3. **Verify Installation**
   - Open "Audio MIDI Setup" (Applications → Utilities → Audio MIDI Setup)
   - You should see "BlackHole 16ch" in the list of audio devices

### Step 2: Create Multi-Output Device

A Multi-Output Device allows you to send audio to both your speakers AND BlackHole simultaneously.

### Setup Steps:

1. **Open Audio MIDI Setup**

   - Applications → Utilities → Audio MIDI Setup

2. **Create Multi-Output Device**

   - Click the **+** button at the bottom left
   - Select "Create Multi-Output Device"

3. **Configure Multi-Output Device**

   - Check the boxes for:
     - ✅ **BlackHole 16ch** (or BlackHole 2ch if you installed that version)
     - ✅ **MacBook Speakers** (or your headphones/output device)
   - Name it "Multi-Output" or something memorable

4. **Set as Default Output** (Optional but Recommended)
   - Right-click the Multi-Output Device
   - Select "Use This Device For Sound Output"

### Step 3: Configure Phone.com Desktop App

1. **Open Phone.com Desktop App Settings**

   - Go to Preferences/Settings → Audio

2. **Set Output Device**

   - Set audio output to your **Multi-Output Device** (created in Step 2)
   - This ensures phone.com audio goes to both your speakers (so you can hear) AND BlackHole (so the system can capture it)

3. **Test Audio**
   - Make a test call or play a test sound
   - You should hear audio through your speakers
   - The system should now be able to capture this audio

### Step 4: Configure Backend Environment

1. **Set Environment Variable**

   - Open your `.env` file in the `flushjohn-api` directory
   - Add the following line:
     ```bash
     SYSTEM_AUDIO_DEVICE="BlackHole 16ch"
     ```
   - **Note**: The device name must match **exactly** as shown in Audio MIDI Setup (case-sensitive)
   - Common names: "BlackHole 16ch" (recommended), "BlackHole 2ch"

2. **Find Your Exact Device Name** (if different)
   - Open Audio MIDI Setup
   - Look at the exact name of your BlackHole device
   - Use that exact name (case-sensitive) in the environment variable

### Step 5: Install System Dependencies

The audio capture requires `sox` to be installed on your system.

### Install Sox:

```bash
# Using Homebrew (recommended)
brew install sox

# Verify installation
sox --version
```

### Step 6: Test the Setup

1. **Start the Backend Server**

   ```bash
   cd flushjohn-api
   npm install  # Install node-record-lpcm16 if not already done
   npm run dev
   ```

2. **Check Logs**

   - When you start recognition, you should see:
     ```
     [SystemAudio] Configuration: Using device 'BlackHole 16ch'
     [SystemAudio] Starting capture from device: BlackHole 16ch
     ```

3. **Test Audio Capture**
   - Open Sales Assist or Vendor Assist modal in the CRM
   - Start a call in phone.com
   - You should see transcripts from both:
     - `[FJ Rep]:` (your microphone)
     - `[Lead]:` or `[Vendor Rep]:` (phone.com audio via BlackHole)

## Switching Between Desktop App and Web App

The system intelligently handles both audio sources:

- **Desktop App**: System audio capture starts automatically when recording begins
- **Web App**: Click the desktop icon button to start tab audio capture
- **Automatic Switching**: When tab audio starts, system audio automatically stops (and vice versa when tab audio stops)

This means you can:

- Use desktop app → system audio captures automatically
- Use web app → click tab audio button to capture
- Switch mid-call → system automatically uses the active source

## Troubleshooting

### Browser Tab Audio Issues (Option 1)

**Issue: "Share tab audio" option not available**

- **Solution**: Make sure you're using a modern browser (Chrome, Edge, or Safari 14+)
- Some browsers may require enabling screen capture permissions in system settings

**Issue: Tab audio button doesn't appear**

- **Solution**: Make sure you've started recording (microphone button is active) first

**Issue: Can't select Phone.com tab**

- **Solution**: Make sure the Phone.com tab is open and active before clicking the desktop icon button

---

### Desktop App Issues (Option 2)

### Issue: "System audio capture failed" error

**Possible causes:**

1. BlackHole not installed

   - **Solution**: Install BlackHole (Step 1)

2. Device name mismatch

   - **Solution**: Check the exact device name in Audio MIDI Setup and update `SYSTEM_AUDIO_DEVICE` in `.env`

3. Sox not installed

   - **Solution**: Install sox using `brew install sox`

4. Phone.com not routing to BlackHole
   - **Solution**: Ensure phone.com output is set to Multi-Output Device (Step 3)

### Issue: Can't hear customer/vendor audio

**Cause**: Multi-Output Device not configured correctly

**Solution**:

- Ensure both BlackHole AND your speakers are checked in Multi-Output Device
- Set Multi-Output Device as your system default output

### Issue: Only operator audio is captured

**Possible causes:**

1. System audio capture failed (check backend logs)
2. Phone.com not using Multi-Output Device
3. BlackHole device name incorrect in environment variable

**Solution**: Check backend logs for specific error messages

### Issue: Audio quality issues or delays

**Possible causes:**

1. System resource constraints
2. Network latency (if using remote server)

**Solution**:

- Close other applications using audio
- Check CPU usage
- Ensure stable network connection

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│  Phone.com App  │────────▶│  Multi-Output    │
│  (Customer)     │         │  Device          │
└─────────────────┘         └────────┬─────────┘
                                     │
                                     ├─────────▶ Speakers (you hear)
                                     │
                                     └─────────▶ BlackHole 2ch
                                                  │
                                                  ▼
                                    ┌─────────────────────┐
                                    │  Node.js Backend    │
                                    │  (captures audio)   │
                                    └─────────────────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────┐
                                    │ Google Speech-to-Text│
                                    └─────────────────────┘
                                                  │
                                                  ▼
                                    ┌─────────────────────┐
                                    │  CRM UI             │
                                    │  [Customer]: text   │
                                    └─────────────────────┘
```

## Fallback Behavior

If system audio capture fails or BlackHole is not configured:

- **Operator audio still works** (captured via browser microphone)
- System will show a warning but continue functioning
- You can still use Sales/Vendor Assist, but only operator speech will be transcribed
- Customer/vendor speech will need to be transcribed manually or via other means

## Additional Resources

- [BlackHole GitHub](https://github.com/ExistentialAudio/BlackHole)
- [Sox Documentation](http://sox.sourceforge.net/)
- [macOS Audio MIDI Setup Guide](https://support.apple.com/guide/audio-midi-setup/)

## Support

If you continue to experience issues:

1. Check backend logs for specific error messages
2. Verify all steps above are completed correctly
3. Ensure device names match exactly (case-sensitive)
4. Test with a simple audio playback to verify BlackHole capture is working
