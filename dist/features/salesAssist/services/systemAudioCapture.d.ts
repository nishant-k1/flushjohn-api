/**
 * System Audio Capture Service
 * Captures audio from virtual audio devices (e.g., BlackHole) on macOS
 * Used to capture customer/vendor audio from phone.com app
 */
/**
 * Start capturing system audio from the configured device
 * @param {Function} onData - Callback function called with audio data chunks (Buffer)
 * @param {Function} onError - Callback function called on errors
 * @returns {Object} - Recording object with stop() method
 */
export declare const startSystemAudioCapture: (onData: any, onError: any) => {
    stop: () => void;
    device: string;
    stream: any;
    recording: any;
};
/**
 * Check if the configured audio device is available
 * @returns {Promise<boolean>} - True if device is available
 */
export declare const isDeviceAvailable: () => Promise<boolean>;
/**
 * List available audio input devices
 * @returns {Promise<Array>} - Array of available device names
 */
export declare const listAvailableDevices: () => Promise<string[]>;
/**
 * Validate that the audio device configuration is correct
 * Logs warnings if device might not be available
 */
export declare const validateConfiguration: () => boolean;
//# sourceMappingURL=systemAudioCapture.d.ts.map