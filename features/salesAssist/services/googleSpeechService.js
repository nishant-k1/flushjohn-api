/**
 * Google Cloud Speech-to-Text Service
 * Handles real-time speech recognition
 * Note: Speaker identification is done via audio source (input_audio/output_audio), not diarization
 */

import { SpeechClient } from "@google-cloud/speech";

// Initialize the Speech client
// Credentials can be provided via:
// 1. GOOGLE_CREDENTIALS_JSON environment variable (JSON string - recommended for production)
// 2. GOOGLE_APPLICATION_CREDENTIALS environment variable (path to service account JSON file - for local dev)
let speechClient = null;

/**
 * Initialize the Speech client with credentials
 * Supports both JSON string (production) and file path (local development)
 */
const initializeSpeechClient = () => {
  try {
    // Option 1: Check for JSON credentials string (production)
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      console.log("Initializing Google Speech client with JSON credentials...");
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      return new SpeechClient({ credentials });
    }

    // Option 2: Check for file path (local development)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log("Initializing Google Speech client with credentials file...");
      return new SpeechClient();
    }

    // Option 3: No credentials configured - skip initialization
    console.warn(
      "⚠️  Google Speech client NOT initialized - credentials not configured"
    );
    console.warn("ℹ️  Speech recognition features will be unavailable");
    console.warn(
      "ℹ️  Set GOOGLE_CREDENTIALS_JSON (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (file path) to enable"
    );
    return null;
  } catch (error) {
    console.warn(
      "Google Cloud Speech client initialization failed:",
      error.message
    );
    console.warn(
      "Set GOOGLE_CREDENTIALS_JSON (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (file path)"
    );
    return null;
  }
};

// Initialize the client
speechClient = initializeSpeechClient();

/**
 * Create a streaming recognition request configuration
 * @returns {Object} Recognition configuration
 */
export const createRecognitionConfig = () => {
  return {
    encoding: "LINEAR16", // 16-bit linear PCM
    sampleRateHertz: 16000, // 16kHz sample rate
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    model: "phone_call", // Optimized for phone calls
    useEnhanced: true, // Use enhanced model for better accuracy
    // Note: Speaker identification is done via audio source tags (input_audio/output_audio)
    // No diarization needed since we have separate audio streams
  };
};

/**
 * Start a streaming recognition session
 * @param {Function} onTranscript - Callback for transcript updates
 * @param {Function} onError - Callback for errors
 * @returns {Object} StreamingRecognizeClient and request configuration
 */
export const startStreamingRecognition = (onTranscript, onError) => {
  if (!speechClient) {
    throw new Error(
      "Google Cloud Speech client not initialized. Please configure credentials."
    );
  }

  const config = createRecognitionConfig();

  // Create the request with streamingConfig
  const request = {
    config: config,
    interimResults: true, // Get interim results for real-time display
  };

  // Create the streaming recognize client
  // Pass the config directly - the client library handles wrapping it
  const recognizeStream = speechClient
    .streamingRecognize(request)
    .on("error", (error) => {
      console.error("Speech recognition error:", error);
      onError(error);
    })
    .on("data", (data) => {
      if (data.results && data.results.length > 0) {
        const result = data.results[0];

        if (result.alternatives && result.alternatives.length > 0) {
          const transcript = result.alternatives[0].transcript;
          const isFinal = result.isFinal || false;

          // Note: speakerTag is not used - speaker identification is done via audio source
          // (input_audio = FJ Rep, output_audio = Lead/Vendor Rep)

          onTranscript({
            transcript,
            isFinal,
            confidence: result.alternatives[0].confidence || null,
          });
        }
      }
    });

  // Track if first write has been done
  let isFirstWrite = true;

  return {
    stream: recognizeStream,
    write: (audioChunk) => {
      // For the Node.js client library, we just write the audio content directly
      // The library handles the protocol internally
      if (isFirstWrite) {
        console.log(
          "First audio chunk received, streaming to Google Speech API..."
        );
        isFirstWrite = false;
      }
      recognizeStream.write(audioChunk);
    },
    end: () => {
      recognizeStream.end();
    },
  };
};

/**
 * Process audio buffer for recognition
 * Audio should be in LINEAR16 format, 16kHz, mono
 * @param {Buffer} audioBuffer - Audio data buffer
 * @returns {Promise<Object>} Recognition results
 */
export const recognizeAudioBuffer = async (audioBuffer) => {
  if (!speechClient) {
    throw new Error(
      "Google Cloud Speech client not initialized. Please configure credentials."
    );
  }

  const config = createRecognitionConfig();
  const request = {
    config: config,
    audio: {
      content: audioBuffer.toString("base64"),
    },
  };

  try {
    const [response] = await speechClient.recognize(request);

    if (response.results && response.results.length > 0) {
      const results = response.results
        .map((result) => {
          if (result.alternatives && result.alternatives.length > 0) {
            const alternative = result.alternatives[0];
            return {
              transcript: alternative.transcript,
              confidence: alternative.confidence || null,
              words: alternative.words || [],
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        success: true,
        results,
      };
    }

    return {
      success: true,
      results: [],
    };
  } catch (error) {
    console.error("Error recognizing audio:", error);
    throw error;
  }
};

/**
 * Check if Google Cloud Speech client is initialized
 * @returns {boolean}
 */
export const isInitialized = () => {
  return speechClient !== null;
};
