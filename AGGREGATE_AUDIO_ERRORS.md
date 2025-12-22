# Aggregate Audio Capture - Error Reference Guide

This document explains common errors when using Aggregate Device audio capture and how to resolve them.

## Error Codes

### DEVICE_NOT_FOUND

**Error Code:** `DEVICE_NOT_FOUND`

**Message:** Aggregate Device not found

**Common Causes:**

- Device name in `.env` doesn't match Audio MIDI Setup (case-sensitive)
- Aggregate Device not created in Audio MIDI Setup
- Device name has extra spaces or special characters

**Solutions:**

1. Open Audio MIDI Setup (Applications → Utilities → Audio MIDI Setup)
2. Find your Aggregate Device and note the **exact name** (including spaces and capitalization)
3. Update `.env`:
   ```bash
   AGGREGATE_AUDIO_DEVICE="Exact Device Name From Audio MIDI Setup"
   ```
4. Restart the backend server

**Example:**

- If device is named "Aggregate Device" in Audio MIDI Setup
- Use: `AGGREGATE_AUDIO_DEVICE="Aggregate Device"` (not "aggregate device" or "AggregateDevice")

---

### SOX_NOT_INSTALLED

**Error Code:** `SOX_NOT_INSTALLED`

**Message:** Sox audio tool is not installed or not in PATH

**Common Causes:**

- Sox not installed via Homebrew
- Sox not in system PATH
- Homebrew not installed

**Solutions:**

1. Install sox:
   ```bash
   brew install sox
   ```
2. Verify installation:
   ```bash
   sox --version
   ```
3. If not found, check PATH:
   ```bash
   which sox
   ```
4. Restart the backend server after installation

---

### PERMISSION_DENIED

**Error Code:** `PERMISSION_DENIED`

**Message:** Permission denied to access audio device

**Common Causes:**

- macOS microphone permission not granted
- Terminal/Node.js doesn't have microphone access
- System security settings blocking audio access

**Solutions:**

1. Open **System Preferences → Security & Privacy → Privacy → Microphone**
2. Enable microphone access for:
   - Terminal (if running via terminal)
   - Node.js
   - Your IDE/editor (if running from there)
3. Restart the backend server
4. If still failing, try running from Terminal directly to grant permissions

---

### DEVICE_IN_USE

**Error Code:** `DEVICE_IN_USE`

**Message:** Aggregate Device is already in use by another application

**Common Causes:**

- Another application is using the audio device
- Previous recording session didn't close properly
- Audio MIDI Setup has device locked

**Solutions:**

1. Close all applications that might be using audio:
   - Other recording software
   - Video conferencing apps
   - Music players
2. Check Audio MIDI Setup - ensure device isn't locked
3. Restart the backend server
4. If persistent, restart your Mac

---

### INVALID_CONFIGURATION

**Error Code:** `INVALID_CONFIGURATION`

**Message:** Invalid audio device configuration

**Common Causes:**

- Aggregate Device has fewer than 2 channels
- Channel mapping points to invalid channels
- Devices in Aggregate Device are disabled

**Solutions:**

1. Open Audio MIDI Setup
2. Select your Aggregate Device
3. Verify:
   - At least 2 devices are added (mic + BlackHole)
   - Both devices are **enabled** (checkboxes checked)
   - Device shows 2+ channels
4. Check channel mapping in `.env`:
   ```bash
   OPERATOR_AUDIO_CHANNEL=1  # Must be >= 1
   CUSTOMER_AUDIO_CHANNEL=2  # Must be >= 1 and different from operator
   ```

---

### NO_AUDIO_DATA

**Error Code:** `NO_AUDIO_DATA`

**Message:** No audio data received from Aggregate Device

**Common Causes:**

- Device is capturing but no audio is being produced
- Microphone is muted
- BlackHole not receiving audio from Multi-Output Device
- Phone.com not configured to use Multi-Output Device

**Solutions:**

1. Check microphone is not muted
2. Verify Phone.com is using Multi-Output Device:
   - Phone.com Settings → Audio → Output Device = Multi-Output Device
3. Verify Multi-Output Device includes:
   - BlackHole 16ch (checked)
   - Your speakers (checked)
4. Test by playing audio - you should hear it and see data in logs
5. Check Aggregate Device in Audio MIDI Setup - both devices should show activity

---

### PROCESSING_ERROR

**Error Code:** `PROCESSING_ERROR`

**Message:** Error processing audio chunk

**Common Causes:**

- Buffer overflow during channel separation
- Invalid audio format
- Memory issues

**Solutions:**

1. Check backend logs for specific error details
2. Verify Aggregate Device is producing valid audio
3. Restart the backend server
4. If persistent, check system resources (CPU/Memory)

---

### STREAM_ERROR

**Error Code:** `STREAM_ERROR`

**Message:** Audio stream error

**Common Causes:**

- Underlying sox process crashed
- Device disconnected during capture
- System audio driver issues

**Solutions:**

1. Check backend logs for sox errors
2. Verify device is still available in Audio MIDI Setup
3. Restart the backend server
4. If sox errors, reinstall: `brew reinstall sox`

---

## Debugging Steps

### 1. Verify Configuration

```bash
# Check .env file
cat .env | grep AGGREGATE_AUDIO_DEVICE

# Should show:
# AGGREGATE_AUDIO_DEVICE="Your Device Name"
```

### 2. List Available Devices

```bash
# Using sox
sox --show-device

# Or check Audio MIDI Setup manually
```

### 3. Test Device Access

```bash
# Try recording a test file
sox -d -r 16000 -c 2 -t wav test.wav
# Press Ctrl+C after a few seconds
# If this fails, device access issue
```

### 4. Check Backend Logs

Look for:

- `[AggregateAudio] Starting capture from device: ...`
- `[AggregateAudio] Channel mapping: ...`
- `[AggregateAudio] Started capture for socket: ...`

If you see errors, note the error code and message.

---

## Common Error Patterns

### Pattern 1: Device Name Mismatch

```
Error: no such file or directory
Solution: Check exact device name (case-sensitive)
```

### Pattern 2: Sox Not Found

```
Error: command not found: sox
Solution: brew install sox
```

### Pattern 3: Permission Issues

```
Error: Permission denied
Solution: Grant microphone access in System Preferences
```

### Pattern 4: Device Busy

```
Error: Device or resource busy
Solution: Close other audio applications
```

---

## Quick Checklist

Before reporting an error, verify:

- [ ] BlackHole 16ch is installed
- [ ] Aggregate Device is created in Audio MIDI Setup
- [ ] Aggregate Device includes mic + BlackHole 16ch (both enabled)
- [ ] Multi-Output Device is created (speakers + BlackHole 16ch)
- [ ] Phone.com is using Multi-Output Device
- [ ] `.env` has `AGGREGATE_AUDIO_DEVICE` with exact device name
- [ ] Sox is installed: `brew install sox`
- [ ] Microphone permission is granted
- [ ] Backend server is restarted after configuration changes

---

## Getting Help

When reporting errors, include:

1. **Error Code** (from logs)
2. **Full Error Message**
3. **Backend Logs** (last 50 lines)
4. **Configuration:**
   - Device name from Audio MIDI Setup
   - `.env` settings (sanitized)
   - Channel mapping values
5. **System Info:**
   - macOS version
   - Node.js version
   - Sox version (`sox --version`)
