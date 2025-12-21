/**
 * Speech Recognition Socket Handler
 * Handles real-time audio streaming for Google Cloud Speech-to-Text
 * Auto-triggers AI response generation for operator assistance
 */

import * as googleSpeechService from "../services/googleSpeechService.js";
import * as salesAssistService from "../services/salesAssistService.js";
import * as conversationLogRepository from "../repositories/conversationLogRepository.js";

// Store active recognition streams per socket
const activeStreams = new Map();

// Store conversation context per socket
const conversationContexts = new Map();

/**
 * Verify JWT token for socket connection
 */
const verifySocketToken = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Import jwt for verification
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.verify(token, process.env.SECRET_KEY);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};

/**
 * Handle speech recognition socket connections
 */
export const speechRecognitionSocketHandler = (namespace, socket) => {
  console.log(`Speech recognition client connected: ${socket.id}`);

  let recognitionWrapper = null; // The wrapper object { stream, write, end }
  let fullTranscript = ""; // Accumulate full conversation transcript
  let extractedInfo = {}; // Store extracted information
  let isGeneratingResponse = false; // Prevent concurrent AI calls
  let lastResponseTime = 0; // Throttle response generation

  // Initialize conversation context
  conversationContexts.set(socket.id, {
    transcript: "",
    extractedInfo: {},
    conversationHistory: [],
    leadId: null,
    lastPricingBreakdown: null,
    lastQuotedPrice: null,
    speakerRoles: null,
    startTime: null,
  });

  // Start recognition
  socket.on("start-recognition", (options = {}) => {
    try {
      if (!googleSpeechService.isInitialized()) {
        socket.emit("error", {
          message:
            "Google Cloud Speech-to-Text is not configured. Please set GOOGLE_CREDENTIALS_JSON environment variable.",
        });
        return;
      }

      // Store leadId if provided
      const context = conversationContexts.get(socket.id);
      if (options.leadId) {
        context.leadId = options.leadId;
      }
      context.startTime = Date.now();

      // Create callbacks
      const onTranscriptCallback = async (data) => {
        socket.emit("transcript", data);

        // If this is a final transcript, accumulate and trigger AI response
        if (data.isFinal && data.transcript) {
          const speakerLabel = data.speakerTag
            ? `[Speaker ${data.speakerTag}]`
            : "";
          const transcriptLine = speakerLabel
            ? `${speakerLabel}: ${data.transcript}`
            : data.transcript;

          // Add to full transcript
          fullTranscript = fullTranscript
            ? `${fullTranscript}\n${transcriptLine}`
            : transcriptLine;

          // Update context
          context.transcript = fullTranscript;

          // Throttle: only generate response if 1.5 seconds have passed
          const now = Date.now();
          if (now - lastResponseTime > 1500 && !isGeneratingResponse) {
            lastResponseTime = now;
            generateAIResponse(socket, context);
          }
        }
      };

      const onErrorCallback = (error) => {
        console.error("Recognition stream error:", error);
        socket.emit("error", {
          message: error.message || "Speech recognition error occurred",
        });
        cleanup();
      };

      // Start streaming recognition - returns { stream, write, end }
      recognitionWrapper = googleSpeechService.startStreamingRecognition(
        onTranscriptCallback,
        onErrorCallback
      );

      activeStreams.set(socket.id, recognitionWrapper);
      console.log(`Started recognition stream for socket: ${socket.id}`);
      socket.emit("recognition-started");
    } catch (error) {
      console.error("Error starting recognition:", error);
      socket.emit("error", {
        message: error.message || "Failed to start recognition",
      });
    }
  });

  /**
   * Generate AI response for the operator
   */
  const generateAIResponse = async (socket, context) => {
    if (isGeneratingResponse) return;
    isGeneratingResponse = true;

    try {
      // First, analyze the conversation to extract info
      const analysisResult = await salesAssistService.analyzeConversation(
        context.transcript,
        {}
      );

      // Update extracted info
      context.extractedInfo = {
        ...context.extractedInfo,
        ...analysisResult,
      };

      // Generate real-time response
      const responseResult = await salesAssistService.generateRealTimeResponse({
        transcript: context.transcript,
        conversationHistory: context.conversationHistory,
        extractedInfo: context.extractedInfo,
        leadId: context.leadId,
      });

      // Store pricing for later saving
      if (responseResult.pricingBreakdown) {
        context.lastPricingBreakdown = responseResult.pricingBreakdown;
        context.lastQuotedPrice = responseResult.pricingBreakdown.grandTotal;
      }
      if (analysisResult.speakerRoles) {
        context.speakerRoles = analysisResult.speakerRoles;
      }

      // Emit the operator response
      socket.emit("operator-response", {
        response: responseResult.response,
        pricingBreakdown: responseResult.pricingBreakdown,
        nextAction: responseResult.nextAction,
        confidence: responseResult.confidence,
        extractedInfo: context.extractedInfo,
        speakerRoles: analysisResult.speakerRoles,
      });

      console.log(`Generated AI response for socket: ${socket.id}`);
    } catch (error) {
      console.error("Error generating AI response:", error);
      socket.emit("ai-error", {
        message: "Failed to generate response suggestion",
        error: error.message,
      });
    } finally {
      isGeneratingResponse = false;
    }
  };

  // Handle audio chunks (expects LINEAR16 PCM format)
  socket.on("audio-chunk", (data) => {
    try {
      const { audioData } = data;

      if (!recognitionWrapper) {
        console.warn("Received audio chunk but no active recognition stream");
        return;
      }

      // Convert base64 to buffer (audioData is already LINEAR16 PCM in base64)
      const audioBuffer = Buffer.from(audioData, "base64");

      // Write audio data using the wrapper's write method
      // This properly wraps the audio in { audioContent: buffer } format
      recognitionWrapper.write(audioBuffer);
    } catch (error) {
      console.error("Error processing audio chunk:", error);
      socket.emit("error", {
        message: "Error processing audio chunk: " + error.message,
      });
    }
  });

  // End recognition
  socket.on("end-recognition", () => {
    cleanup();
    socket.emit("recognition-ended");
  });

  // Cleanup function
  const cleanup = () => {
    if (recognitionWrapper) {
      try {
        recognitionWrapper.end();
      } catch (error) {
        console.error("Error ending recognition stream:", error);
      }
      recognitionWrapper = null;
    }
    activeStreams.delete(socket.id);
    conversationContexts.delete(socket.id);
    fullTranscript = "";
    extractedInfo = {};
    console.log(`Cleaned up recognition stream for socket: ${socket.id}`);
  };

  // Handle manual request for AI response
  socket.on("request-response", async () => {
    const context = conversationContexts.get(socket.id);
    if (context && context.transcript) {
      generateAIResponse(socket, context);
    }
  });

  // Handle saving the conversation log
  socket.on("save-conversation", async (options = {}) => {
    const context = conversationContexts.get(socket.id);
    if (!context || !context.transcript || context.transcript.length < 20) {
      socket.emit("conversation-saved", {
        success: false,
        message: "No conversation to save",
      });
      return;
    }

    try {
      const duration = context.startTime
        ? Math.floor((Date.now() - context.startTime) / 1000)
        : null;

      const conversationData = {
        lead: context.leadId || null,
        transcript: context.transcript,
        extractedInfo: context.extractedInfo
          ? {
              location: context.extractedInfo.location,
              eventType: context.extractedInfo.eventType,
              quantity: context.extractedInfo.quantity,
              dates: context.extractedInfo.dates,
              intent: context.extractedInfo.intent,
              summary: context.extractedInfo.summary,
            }
          : {},
        quotedPrice: context.lastQuotedPrice || null,
        pricingBreakdown: context.lastPricingBreakdown || null,
        outcome: options.outcome || "pending",
        speakerRoles: context.speakerRoles || {},
        operatorId: socket.userId || null,
        duration: duration,
        operatorFeedback: options.feedback || null,
        aiHelpful: options.aiHelpful || null,
      };

      const savedLog = await conversationLogRepository.create(conversationData);

      socket.emit("conversation-saved", {
        success: true,
        conversationId: savedLog._id,
        message: "Conversation saved for AI learning",
      });

      console.log(`Saved conversation log for socket: ${socket.id}`);
    } catch (error) {
      console.error("Error saving conversation log:", error);
      socket.emit("conversation-saved", {
        success: false,
        message: "Failed to save conversation",
        error: error.message,
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Speech recognition client disconnected: ${socket.id}`);
    cleanup();
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
    cleanup();
  });
};

/**
 * Initialize speech recognition namespace
 */
export const initializeSpeechRecognitionNamespace = (io) => {
  const speechNamespace = io.of("/speech-recognition");

  // Apply authentication middleware
  speechNamespace.use(verifySocketToken);

  speechNamespace.on("connection", (socket) => {
    speechRecognitionSocketHandler(speechNamespace, socket);
  });

  return speechNamespace;
};
