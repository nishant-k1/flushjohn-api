# Aggregate Device & Multi-Output Device Setup

This guide explains how to configure the system to use Aggregate Device and Multi-Output Device with BlackHole 16ch.

## Overview

The system now supports using an **Aggregate Device** that combines:

- **MacBook Air microphone** (operator audio - FJ Rep)
- **BlackHole 16ch input** (customer/vendor audio from system)

This provides a single input source that captures both audio streams simultaneously, with automatic channel separation.

## Setup Steps

### 1. Install BlackHole 16ch

1. Download from: https://github.com/ExistentialAudio/BlackHole/releases
2. Install BlackHole 16ch (recommended for better quality)
3. Verify installation in Audio MIDI Setup

### 2. Create Aggregate Device (Input)

1. Open **Audio MIDI Setup** (Applications → Utilities → Audio MIDI Setup)
2. Click the **+** button → Select **"Create Aggregate Device"**
3. Check the boxes for:
   - ✅ **MacBook Air Microphone** (or your physical microphone)
   - ✅ **BlackHole 16ch** (input)
4. Name it something memorable (e.g., "Aggregate Device" or "Sales Assist Input")
5. **Important**: Note the order - first device = Channel 1, second device = Channel 2

### 3. Create Multi-Output Device (Output)

1. In **Audio MIDI Setup**, click the **+** button → Select **"Create Multi-Output Device"**
2. Check the boxes for:
   - ✅ **BlackHole 16ch** (output)
   - ✅ **MacBook Air Speakers** (or your headphones)
3. Name it (e.g., "Multi-Output" or "Sales Assist Output")
4. (Optional) Set as default output device

### 4. Configure Phone.com Desktop App

1. Open Phone.com desktop app
2. Go to **Preferences/Settings → Audio**
3. Set **Output Device** to your **Multi-Output Device**
4. This routes Phone.com audio to both:
   - Your speakers (so you can hear)
   - BlackHole 16ch (so the system can capture it)

### 5. Configure Backend Environment

Add to your `.env` file:

```bash
# Aggregate Device Configuration
AGGREGATE_AUDIO_DEVICE="Aggregate Device"

# Channel Mapping (optional - defaults shown)
# OPERATOR_AUDIO_CHANNEL=1  # Channel for operator/mic audio
# CUSTOMER_AUDIO_CHANNEL=2  # Channel for customer/BlackHole audio
```

**Note**: Replace `"Aggregate Device"` with the exact name of your Aggregate Device from Audio MIDI Setup (case-sensitive).

## How It Works

1. **Aggregate Device** captures both:

   - Channel 1: MacBook mic → Operator audio (FJ Rep)
   - Channel 2: BlackHole input → Customer/Vendor audio (Lead or Vendor Rep)

2. **System automatically separates channels**:

   - Operator channel → Google Speech-to-Text (operator stream)
   - Customer channel → Google Speech-to-Text (customer stream)

3. **Speaker identification**:
   - Sales Assist: Mic = FJ Rep, BlackHole = Lead
   - Vendor Assist: Mic = FJ Rep, BlackHole = Vendor Rep

## Fallback Behavior

If `AGGREGATE_AUDIO_DEVICE` is not configured, the system falls back to:

- Frontend microphone capture (browser)
- Separate system audio capture (BlackHole)

## Channel Mapping

By default:

- **Channel 1** = Operator/Mic audio
- **Channel 2** = Customer/BlackHole audio

If your Aggregate Device has a different channel order, configure:

```bash
OPERATOR_AUDIO_CHANNEL=2  # If mic is on channel 2
CUSTOMER_AUDIO_CHANNEL=1  # If BlackHole is on channel 1
```

## Verification

When you start recording, check backend logs:

```
[AggregateAudio] Starting capture from device: Aggregate Device
[AggregateAudio] Channel mapping: Operator=Channel 1, Customer=Channel 2
[AggregateAudio] Started capture for socket: <socket-id>
```

## Troubleshooting

### Issue: "Aggregate audio capture failed"

- **Solution**: Verify Aggregate Device name matches exactly in `.env`
- Check that Aggregate Device includes both mic and BlackHole 16ch
- Ensure BlackHole 16ch is installed

### Issue: Wrong speaker labels

- **Solution**: Check channel mapping - may need to swap `OPERATOR_AUDIO_CHANNEL` and `CUSTOMER_AUDIO_CHANNEL`
- Verify device order in Aggregate Device setup

### Issue: No audio from one channel

- **Solution**: Check that both devices are enabled in Aggregate Device
- Verify Multi-Output Device is configured correctly
- Ensure Phone.com is using Multi-Output Device

## Benefits of Aggregate Device Approach

✅ **Single input source** - simpler configuration  
✅ **Synchronized audio** - both channels captured simultaneously  
✅ **No frontend mic needed** - everything captured on backend  
✅ **Better audio quality** - direct hardware capture  
✅ **Automatic channel separation** - no manual switching
