/**
 * Aggregate Audio Capture Service
 * Captures audio from an Aggregate Device that combines:
 * - MacBook Air microphone (operator audio)
 * - BlackHole 16ch input (customer/vendor audio from system)
 *
 * Separates the channels and routes them to appropriate streams
 */

import recorder from "node-record-lpcm16";
import { execSync } from "child_process";

/**
 * Check if sox is installed and available
 * Tries multiple methods to find sox, including common installation paths
 */
const checkSoxAvailable = () => {
  // Method 1: Try 'which sox' (works if sox is in PATH)
  try {
    execSync("which sox", { stdio: "ignore" });
    return true;
  } catch (error) {
    // Continue to try other methods
  }

  // Method 2: Try common installation paths
  const commonPaths = [
    "/opt/homebrew/bin/sox", // Homebrew on Apple Silicon
    "/usr/local/bin/sox",    // Homebrew on Intel Mac
    "/usr/bin/sox",          // System installation
  ];

  for (const soxPath of commonPaths) {
    try {
      execSync(`test -f ${soxPath}`, { stdio: "ignore" });
      // If file exists, try to run it
      execSync(`${soxPath} --version`, { stdio: "ignore" });
      return true;
    } catch (error) {
      // Continue to next path
    }
  }

  // Method 3: Try running 'sox --version' directly (might work even if 'which' fails)
  try {
    execSync("sox --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get the configured aggregate device name
 * This should be the name of your Aggregate Device in Audio MIDI Setup
 */
const getAggregateDevice = () => {
  return (
    process.env.AGGREGATE_AUDIO_DEVICE ||
    process.env.SYSTEM_AUDIO_DEVICE ||
    "Aggregate Device"
  );
};

/**
 * Get the channel mapping configuration
 * Which channel in the aggregate device corresponds to which audio source
 */
const getChannelMapping = () => {
  // Default: Channel 1 = Mic (operator), Channel 2 = BlackHole (customer)
  // This can be configured via environment variables if needed
  return {
    operatorChannel:
      parseInt(process.env.OPERATOR_AUDIO_CHANNEL || "1", 10) - 1, // 0-indexed
    customerChannel:
      parseInt(process.env.CUSTOMER_AUDIO_CHANNEL || "2", 10) - 1, // 0-indexed
  };
};

/**
 * Start capturing audio from the Aggregate Device
 * Separates channels and routes them to appropriate callbacks
 *
 * @param {Function} onOperatorData - Callback for operator (mic) audio chunks
 * @param {Function} onCustomerData - Callback for customer (BlackHole) audio chunks
 * @param {Function} onError - Callback for errors
 * @returns {Object} - Recording object with stop() method
 */
/**
 * Create a detailed error message based on the error type
 */
const createDetailedErrorMessage = (error, device) => {
  const errorMessage = error.message || String(error);
  const errorString = errorMessage.toLowerCase();

  // Check for common error patterns
  if (
    errorString.includes("no such file") ||
    errorString.includes("not found")
  ) {
    return {
      code: "DEVICE_NOT_FOUND",
      message: `Aggregate Device "${device}" not found. Please verify:`,
      details: [
        `1. Device name matches exactly (case-sensitive) in Audio MIDI Setup`,
        `2. Aggregate Device is created and enabled`,
        `3. Both mic and BlackHole 16ch are added to the Aggregate Device`,
        `4. Check device name in Audio MIDI Setup and update AGGREGATE_AUDIO_DEVICE in .env`,
      ],
      originalError: errorMessage,
    };
  }

  if (
    errorString.includes("sox") ||
    errorString.includes("command not found")
  ) {
    return {
      code: "SOX_NOT_INSTALLED",
      message: "Sox audio tool is not installed or not in PATH.",
      details: [
        `Install sox using: brew install sox`,
        `Verify installation: sox --version`,
      ],
      originalError: errorMessage,
    };
  }

  if (
    errorString.includes("permission") ||
    errorString.includes("denied") ||
    errorString.includes("access")
  ) {
    return {
      code: "PERMISSION_DENIED",
      message: "Permission denied to access audio device.",
      details: [
        `1. Check macOS System Preferences → Security & Privacy → Microphone`,
        `2. Ensure Terminal/Node.js has microphone access`,
        `3. Try restarting the application`,
      ],
      originalError: errorMessage,
    };
  }

  if (
    errorString.includes("busy") ||
    errorString.includes("in use") ||
    errorString.includes("already")
  ) {
    return {
      code: "DEVICE_IN_USE",
      message: `Aggregate Device "${device}" is already in use by another application.`,
      details: [
        `1. Close other applications using the audio device`,
        `2. Check Audio MIDI Setup to see if device is locked`,
        `3. Restart the backend server`,
      ],
      originalError: errorMessage,
    };
  }

  if (errorString.includes("invalid") || errorString.includes("bad")) {
    return {
      code: "INVALID_CONFIGURATION",
      message: "Invalid audio device configuration.",
      details: [
        `1. Verify Aggregate Device has at least 2 channels`,
        `2. Check channel mapping (OPERATOR_AUDIO_CHANNEL, CUSTOMER_AUDIO_CHANNEL)`,
        `3. Ensure both devices in Aggregate Device are enabled`,
      ],
      originalError: errorMessage,
    };
  }

  // Generic error
  return {
    code: "UNKNOWN_ERROR",
    message: `Aggregate audio capture failed: ${errorMessage}`,
    details: [
      `1. Verify Aggregate Device exists in Audio MIDI Setup`,
      `2. Check that device name in .env matches exactly`,
      `3. Ensure BlackHole 16ch is installed`,
      `4. Verify sox is installed: brew install sox`,
    ],
    originalError: errorMessage,
  };
};

export const startAggregateAudioCapture = (
  onOperatorData,
  onCustomerData,
  onError
) => {
  const device = getAggregateDevice();
  const channelMapping = getChannelMapping();

  // Validate channel mapping
  if (
    channelMapping.operatorChannel < 0 ||
    channelMapping.customerChannel < 0 ||
    channelMapping.operatorChannel === channelMapping.customerChannel
  ) {
    const error = new Error(
      `Invalid channel mapping: Operator=Channel ${
        channelMapping.operatorChannel + 1
      }, Customer=Channel ${
        channelMapping.customerChannel + 1
      }. Channels must be different and >= 1.`
    );
    console.error("[AggregateAudio] Configuration error:", error.message);
    if (onError) {
      onError({
        ...createDetailedErrorMessage(error, device),
        type: "CONFIGURATION_ERROR",
      });
    }
    throw error;
  }

  // Check sox availability before attempting capture
  const soxAvailable = checkSoxAvailable();
  console.log(`[AggregateAudio] SOX availability check: ${soxAvailable}`);
  
  if (!soxAvailable) {
    // Try to get more information about why SOX isn't available
    let soxPath = null;
    try {
      soxPath = execSync("which sox", { encoding: "utf-8" }).trim();
    } catch (e) {
      // Try common paths
      const commonPaths = [
        "/opt/homebrew/bin/sox",
        "/usr/local/bin/sox",
        "/usr/bin/sox",
      ];
      for (const path of commonPaths) {
        try {
          execSync(`test -f ${path}`, { stdio: "ignore" });
          soxPath = path;
          break;
        } catch (e2) {
          // Continue
        }
      }
    }
    
    const error = new Error(
      `Sox audio tool is not installed or not in PATH. Install with: brew install sox${soxPath ? ` (Found at: ${soxPath})` : ""}`
    );
    console.error("[AggregateAudio] SOX check failed:", error.message);
    console.error("[AggregateAudio] PATH:", process.env.PATH);
    if (onError) {
      onError({
        ...createDetailedErrorMessage(error, device),
        type: "SOX_NOT_AVAILABLE",
      });
    }
    throw error;
  }
  
  console.log("[AggregateAudio] SOX is available, proceeding with audio capture");

  console.log(`[AggregateAudio] Starting capture from device: ${device}`);
  console.log(
    `[AggregateAudio] Channel mapping: Operator=Channel ${
      channelMapping.operatorChannel + 1
    }, Customer=Channel ${channelMapping.customerChannel + 1}`
  );

  let recording = null;
  let audioStream = null;
  let hasReceivedData = false;
  let dataTimeout = null;

  try {
    // Ensure PATH includes common SOX locations for node-record-lpcm16
    // The library needs to find sox when it executes it
    const originalPath = process.env.PATH || "";
    const homebrewPaths = [
      "/opt/homebrew/bin",  // Apple Silicon
      "/usr/local/bin",     // Intel Mac
    ];
    
    // Add Homebrew paths if not already in PATH
    const pathParts = originalPath.split(":");
    const missingPaths = homebrewPaths.filter(p => !pathParts.includes(p));
    if (missingPaths.length > 0) {
      process.env.PATH = [...missingPaths, ...pathParts].join(":");
      console.log(`[AggregateAudio] Updated PATH to include: ${missingPaths.join(", ")}`);
    }
    
    // Capture from aggregate device with multiple channels
    // The aggregate device should have at least 2 channels (mic + BlackHole)
    recording = recorder.record({
      sampleRate: 16000,
      channels: 2, // Aggregate device should have at least 2 channels
      threshold: 0,
      recorder: "sox",
      device: device,
      silence: "0.0",
    });

    // Validate recording object was created
    if (!recording) {
      throw new Error(
        "Failed to create recording object. Check that sox is installed and device name is correct."
      );
    }

    audioStream = recording.stream();

    // Validate stream was created
    if (!audioStream) {
      throw new Error(
        "Failed to create audio stream from recording. Recording object may be invalid."
      );
    }
    let buffer = Buffer.alloc(0);

    // Set timeout to detect if no audio data is received
    dataTimeout = setTimeout(() => {
      if (!hasReceivedData) {
        const error = new Error(
          "No audio data received from Aggregate Device. Device may not be producing audio or may be misconfigured."
        );
        console.error("[AggregateAudio]", error.message);
        if (onError) {
          onError({
            ...createDetailedErrorMessage(error, device),
            type: "NO_AUDIO_DATA",
          });
        }
      }
    }, 5000); // 5 second timeout

    // Process audio data and separate channels
    audioStream.on("data", (chunk) => {
      try {
        hasReceivedData = true;
        if (dataTimeout) {
          clearTimeout(dataTimeout);
          dataTimeout = null;
        }

        // Chunk is LINEAR16 PCM format
        // For stereo (2 channels), data is interleaved: L, R, L, R, ...
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

        if (!data || data.length === 0) {
          console.warn("[AggregateAudio] Received empty audio chunk");
          return;
        }

        buffer = Buffer.concat([buffer, data]);

        // Process in chunks of 2 channels * 2 bytes per sample = 4 bytes per sample pair
        const bytesPerSample = 2; // 16-bit = 2 bytes
        const channels = 2;
        const bytesPerFrame = bytesPerSample * channels; // 4 bytes per frame (L+R)

        // Process complete frames only
        const framesToProcess = Math.floor(buffer.length / bytesPerFrame);
        if (framesToProcess === 0) return;

        const samplesToProcess = framesToProcess * bytesPerFrame;
        const operatorBuffer = Buffer.alloc(framesToProcess * bytesPerSample);
        const customerBuffer = Buffer.alloc(framesToProcess * bytesPerSample);

        // Separate channels from interleaved data
        for (let i = 0; i < framesToProcess; i++) {
          const frameOffset = i * bytesPerFrame;

          // Validate channel indices
          const operatorOffset =
            frameOffset + channelMapping.operatorChannel * bytesPerSample;
          const customerOffset =
            frameOffset + channelMapping.customerChannel * bytesPerSample;

          if (
            operatorOffset + bytesPerSample > buffer.length ||
            customerOffset + bytesPerSample > buffer.length
          ) {
            console.error(
              `[AggregateAudio] Buffer overflow: frameOffset=${frameOffset}, buffer.length=${buffer.length}`
            );
            break; // Skip this frame
          }

          // Extract samples for each channel
          // Channel 0 (left) = operator, Channel 1 (right) = customer
          const operatorSample = buffer.slice(
            operatorOffset,
            operatorOffset + bytesPerSample
          );
          const customerSample = buffer.slice(
            customerOffset,
            customerOffset + bytesPerSample
          );

          operatorSample.copy(operatorBuffer, i * bytesPerSample);
          customerSample.copy(customerBuffer, i * bytesPerSample);
        }

        // Keep remaining data for next chunk
        buffer = buffer.slice(samplesToProcess);

        // Send separated audio to appropriate callbacks
        if (onOperatorData && operatorBuffer.length > 0) {
          onOperatorData(operatorBuffer);
        }
        if (onCustomerData && customerBuffer.length > 0) {
          onCustomerData(customerBuffer);
        }
      } catch (err) {
        console.error("[AggregateAudio] Error processing audio chunk:", err);
        const detailedError = createDetailedErrorMessage(err, device);
        if (onError) {
          onError({
            ...detailedError,
            type: "PROCESSING_ERROR",
            stack: err.stack,
          });
        }
      }
    });

    audioStream.on("error", (error) => {
      console.error("[AggregateAudio] Stream error:", error);
      if (dataTimeout) {
        clearTimeout(dataTimeout);
      }
      const detailedError = createDetailedErrorMessage(error, device);
      if (onError) {
        onError({
          ...detailedError,
          type: "STREAM_ERROR",
          stack: error.stack,
        });
      }
    });

    audioStream.on("end", () => {
      console.log("[AggregateAudio] Capture stream ended");
    });

    return {
      stop: () => {
        console.log("[AggregateAudio] Stopping capture");
        if (dataTimeout) {
          clearTimeout(dataTimeout);
        }
        try {
          if (recording) {
            recording.stop();
          }
        } catch (err) {
          console.error("[AggregateAudio] Error stopping:", err);
          const detailedError = createDetailedErrorMessage(err, device);
          if (onError) {
            onError({
              ...detailedError,
              type: "STOP_ERROR",
            });
          }
        }
      },
      device: device,
      stream: audioStream,
      recording: recording,
    };
  } catch (error) {
    console.error("[AggregateAudio] Failed to start capture:", error);
    if (dataTimeout) {
      clearTimeout(dataTimeout);
    }
    const detailedError = createDetailedErrorMessage(error, device);

    // Log detailed error information
    console.error("[AggregateAudio] Error Code:", detailedError.code);
    console.error("[AggregateAudio] Error Message:", detailedError.message);
    console.error("[AggregateAudio] Details:", detailedError.details);
    console.error(
      "[AggregateAudio] Original Error:",
      detailedError.originalError
    );

    if (onError) {
      onError({
        ...detailedError,
        type: "INITIALIZATION_ERROR",
        stack: error.stack,
      });
    }
    throw error;
  }
};

/**
 * Validate aggregate device configuration
 * Returns validation result with detailed error information
 */
export const validateConfiguration = () => {
  const device = getAggregateDevice();
  const channelMapping = getChannelMapping();
  const errors = [];

  // Check device name
  if (!device || device.trim() === "") {
    errors.push({
      field: "AGGREGATE_AUDIO_DEVICE",
      message: "Aggregate Device name is not configured",
      solution:
        "Set AGGREGATE_AUDIO_DEVICE environment variable to the exact name of your Aggregate Device from Audio MIDI Setup",
    });
  }

  // Validate channel mapping
  if (channelMapping.operatorChannel < 0) {
    errors.push({
      field: "OPERATOR_AUDIO_CHANNEL",
      message: `Invalid operator channel: ${
        channelMapping.operatorChannel + 1
      }. Must be >= 1`,
      solution:
        "Set OPERATOR_AUDIO_CHANNEL to a valid channel number (1, 2, etc.)",
    });
  }

  if (channelMapping.customerChannel < 0) {
    errors.push({
      field: "CUSTOMER_AUDIO_CHANNEL",
      message: `Invalid customer channel: ${
        channelMapping.customerChannel + 1
      }. Must be >= 1`,
      solution:
        "Set CUSTOMER_AUDIO_CHANNEL to a valid channel number (1, 2, etc.)",
    });
  }

  if (channelMapping.operatorChannel === channelMapping.customerChannel) {
    errors.push({
      field: "CHANNEL_MAPPING",
      message: "Operator and Customer channels cannot be the same",
      solution:
        "Set OPERATOR_AUDIO_CHANNEL and CUSTOMER_AUDIO_CHANNEL to different channel numbers",
    });
  }

  // Log validation results
  if (errors.length > 0) {
    console.warn("[AggregateAudio] Configuration validation failed:");
    errors.forEach((error) => {
      console.warn(`  - ${error.field}: ${error.message}`);
      console.warn(`    Solution: ${error.solution}`);
    });
    console.warn(
      "[AggregateAudio] Set AGGREGATE_AUDIO_DEVICE environment variable to the name of your Aggregate Device (e.g., 'Aggregate Device')"
    );
    return false;
  }

  console.log(`[AggregateAudio] Configuration: Using device '${device}'`);
  console.log(
    `[AggregateAudio] Operator audio: Channel ${
      channelMapping.operatorChannel + 1
    }`
  );
  console.log(
    `[AggregateAudio] Customer audio: Channel ${
      channelMapping.customerChannel + 1
    }`
  );
  return true;
};
