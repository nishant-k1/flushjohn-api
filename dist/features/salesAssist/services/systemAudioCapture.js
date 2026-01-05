/**
 * System Audio Capture Service
 * Captures audio from virtual audio devices (e.g., BlackHole) on macOS
 * Used to capture customer/vendor audio from phone.com app
 */
import recorder from "node-record-lpcm16";
/**
 * Get the configured audio device name
 * Defaults to "BlackHole 16ch" (recommended for better audio quality)
 */
const getAudioDevice = () => {
    return process.env.SYSTEM_AUDIO_DEVICE || "BlackHole 16ch";
};
/**
 * Start capturing system audio from the configured device
 * @param {Function} onData - Callback function called with audio data chunks (Buffer)
 * @param {Function} onError - Callback function called on errors
 * @returns {Object} - Recording object with stop() method
 */
export const startSystemAudioCapture = (onData, onError) => {
    const device = getAudioDevice();
    console.log(`[SystemAudio] Starting capture from device: ${device}`);
    try {
        // Note: node-record-lpcm16 uses sox which requires the device to be available
        // If device doesn't exist, sox will fail and we'll catch it in the error handler
        // On macOS, sox uses CoreAudio and device names must match exactly
        const recording = recorder.record({
            sampleRate: 16000, // Note: node-record-lpcm16 uses 'sampleRate' not 'sampleRateHertz'
            threshold: 0, // Don't use silence detection for continuous capture
            recorder: "sox", // Use sox for audio recording on macOS (note: 'recorder' not 'recordProgram')
            // Note: Device specification for sox on macOS
            // For BlackHole, device name must match exactly as shown in Audio MIDI Setup
            // Example: "BlackHole 16ch" (recommended) or "BlackHole 2ch"
            device: device, // Specify the audio device name
            silence: "0.0", // Disable silence detection for continuous streaming
        });
        // Get the actual stream from the Recording instance
        const audioStream = recording.stream();
        // Handle data events on the stream
        audioStream.on("data", (chunk) => {
            if (onData) {
                // Chunk is already in LINEAR16 PCM format (Buffer)
                // Convert to Buffer if needed
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                onData(buffer);
            }
        });
        audioStream.on("error", (error) => {
            console.error("[SystemAudio] Capture error:", error);
            if (onError) {
                onError(error);
            }
        });
        audioStream.on("end", () => {
            console.log("[SystemAudio] Capture stream ended");
        });
        // Return object with stop method
        return {
            stop: () => {
                console.log("[SystemAudio] Stopping capture");
                try {
                    recording.stop();
                }
                catch (err) {
                    console.error("[SystemAudio] Error stopping:", err);
                }
            },
            device: device,
            stream: audioStream,
            recording: recording, // Expose recording instance for debugging
        };
    }
    catch (error) {
        console.error("[SystemAudio] Failed to start capture:", error);
        if (onError) {
            onError(error);
        }
        throw error;
    }
};
/**
 * Check if the configured audio device is available
 * @returns {Promise<boolean>} - True if device is available
 */
export const isDeviceAvailable = async () => {
    const device = getAudioDevice();
    try {
        // On macOS, we can check if BlackHole is available by checking system audio devices
        // For now, we'll attempt to start a test capture and see if it fails
        // This is a basic check - in production, you might want to use system_profiler
        return true; // Optimistic - let the actual capture attempt handle errors
    }
    catch (error) {
        console.error(`[SystemAudio] Device ${device} not available:`, error);
        return false;
    }
};
/**
 * List available audio input devices
 * @returns {Promise<Array>} - Array of available device names
 */
export const listAvailableDevices = async () => {
    // On macOS, you can list devices using:
    // system_profiler SPAudioDataType | grep -A 5 "BlackHole"
    // Or using sox: sox --show-device
    // For now, return the configured device
    return [getAudioDevice()];
};
/**
 * Validate that the audio device configuration is correct
 * Logs warnings if device might not be available
 */
export const validateConfiguration = () => {
    const device = getAudioDevice();
    if (!device || device.trim() === "") {
        console.warn("[SystemAudio] WARNING: SYSTEM_AUDIO_DEVICE not configured. System audio capture may not work.");
        console.warn("[SystemAudio] Set SYSTEM_AUDIO_DEVICE environment variable to the name of your virtual audio device (e.g., 'BlackHole 16ch')");
        return false;
    }
    console.log(`[SystemAudio] Configuration: Using device '${device}'`);
    return true;
};
//# sourceMappingURL=systemAudioCapture.js.map