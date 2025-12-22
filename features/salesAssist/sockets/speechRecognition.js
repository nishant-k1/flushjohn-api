/**
 * Speech Recognition Socket Handler
 * Handles real-time audio streaming for Google Cloud Speech-to-Text
 * Auto-triggers AI response generation for operator assistance
 */

import * as googleSpeechService from "../services/googleSpeechService.js";
import * as salesAssistService from "../services/salesAssistService.js";
import * as conversationLogRepository from "../repositories/conversationLogRepository.js";
import * as vendorConversationLogRepository from "../repositories/vendorConversationLogRepository.js";
import * as systemAudioCapture from "../services/systemAudioCapture.js";
import * as aggregateAudioCapture from "../services/aggregateAudioCapture.js";
import * as pronunciationAnalysisService from "../services/pronunciationAnalysisService.js";

// Store active recognition streams per socket
const activeStreams = new Map();

// Store system audio capture handles per socket
const systemAudioCaptures = new Map();

// Store aggregate audio capture handles per socket
const aggregateAudioCaptures = new Map();

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

  let operatorStream = null; // Recognition stream for operator (mic from frontend)
  let customerStream = null; // Recognition stream for customer (system audio)
  let systemAudioCaptureHandle = null; // Handle to system audio capture
  let fullTranscript = ""; // Accumulate full conversation transcript
  let extractedInfo = {}; // Store extracted information
  let isGeneratingResponse = false; // Prevent concurrent AI calls
  let lastResponseTime = 0; // Throttle response generation
  let operatorStreamStartTime = null; // Track when operator stream started
  let customerStreamStartTime = null; // Track when customer stream started
  let isRestartingStreams = false; // Prevent multiple simultaneous restarts

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
    mode: "sales", // Default to sales mode
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

      // Store leadId and mode if provided
      const context = conversationContexts.get(socket.id);
      if (options.leadId) {
        context.leadId = options.leadId;
      }
      if (options.mode) {
        context.mode = options.mode; // "sales" or "vendor"
      }
      context.startTime = Date.now();

      // Create callback for operator stream (mic from frontend)
      const onOperatorTranscriptCallback = async (data) => {
        // Tag transcript with audioSource
        const transcriptData = {
          ...data,
          audioSource: "operator",
          speakerTag: null, // Don't rely on Google's diarization
        };
        socket.emit("transcript", transcriptData);

        // If this is a final transcript, accumulate and trigger AI response
        if (data.isFinal && data.transcript) {
          // Use actual role name for AI context (operator is always FJ Rep)
          const transcriptLine = `[FJ Rep]: ${data.transcript}`;

          // Add to full transcript
          fullTranscript = fullTranscript
            ? `${fullTranscript}\n${transcriptLine}`
            : transcriptLine;

          // Update context
          context.transcript = fullTranscript;

          // Analyze pronunciation for operator speech
          if (data.transcript && data.transcript.trim().length > 0) {
            try {
              const confidence = data.confidence || 0.7;
              const wordLevelConfidence =
                data.alternatives?.[0]?.words?.map((w) => w.confidence) || [];

              const pronunciationResult =
                await pronunciationAnalysisService.analyzePronunciation({
                  transcript: data.transcript,
                  confidence: confidence,
                  wordLevelConfidence: wordLevelConfidence,
                });

              // Store segment for final summary
              if (!context.pronunciationSegments) {
                context.pronunciationSegments = [];
              }
              context.pronunciationSegments.push(pronunciationResult);

              // Emit real-time pronunciation score
              socket.emit("pronunciation-score", {
                score: pronunciationResult.score,
                segment: pronunciationResult.segment,
                confidence: pronunciationResult.confidence,
                timestamp: pronunciationResult.timestamp,
                syllableAnalysis: pronunciationResult.syllableAnalysis,
                phoneticAnalysis: pronunciationResult.phoneticAnalysis,
              });
            } catch (error) {
              console.error("Error analyzing pronunciation:", error);
              // Continue without blocking
            }
          }

          // DO NOT generate AI response when operator speaks
          // AI responses should only be generated when customer/lead speaks
        }
      };

      // Create callback for customer stream (system audio)
      const onCustomerTranscriptCallback = async (data) => {
        // Tag transcript with audioSource
        const transcriptData = {
          ...data,
          audioSource: "customer",
          speakerTag: null, // Don't rely on Google's diarization
        };
        socket.emit("transcript", transcriptData);

        // If this is a final transcript, accumulate and trigger AI response
        if (data.isFinal && data.transcript) {
          // Use actual role name for AI context based on mode
          // In sales mode: customer = Lead, in vendor mode: customer = Vendor Rep
          const roleLabel = context.mode === "vendor" ? "Vendor Rep" : "Lead";
          const transcriptLine = `[${roleLabel}]: ${data.transcript}`;

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

      // Function to restart both streams when either hits the 305-second limit
      // We restart both together since they likely started at the same time
      const restartStreams = () => {
        if (isRestartingStreams) {
          console.log(
            `[StreamRestart] Already restarting streams, skipping duplicate restart`
          );
          return;
        }

        console.log(
          `[StreamRestart] Restarting both streams due to 305-second limit`
        );
        isRestartingStreams = true;

        try {
          // Close old streams
          if (operatorStream) {
            try {
              operatorStream.end();
            } catch (err) {
              console.error(
                `[StreamRestart] Error ending old operator stream:`,
                err
              );
            }
            operatorStream = null;
          }

          if (customerStream) {
            try {
              customerStream.end();
            } catch (err) {
              console.error(
                `[StreamRestart] Error ending old customer stream:`,
                err
              );
            }
            customerStream = null;
          }

          // Small delay to ensure old streams are fully closed
          setTimeout(() => {
            try {
              // Create new streams
              operatorStream = googleSpeechService.startStreamingRecognition(
                onOperatorTranscriptCallback,
                onOperatorErrorCallback
              );
              operatorStreamStartTime = Date.now();

              customerStream = googleSpeechService.startStreamingRecognition(
                onCustomerTranscriptCallback,
                onCustomerErrorCallback
              );
              customerStreamStartTime = Date.now();

              // Update active streams map
              activeStreams.set(socket.id, {
                operator: operatorStream,
                customer: customerStream,
              });

              console.log(
                `[StreamRestart] Both streams restarted successfully`
              );
              socket.emit("stream-restarted", {
                streamType: "both",
                message: `Streams automatically restarted after 5-minute limit`,
              });
            } catch (err) {
              console.error(`[StreamRestart] Error restarting streams:`, err);
              socket.emit("error", {
                message: `Failed to restart streams: ${err.message}`,
                severity: "error",
              });
            } finally {
              isRestartingStreams = false;
            }
          }, 100); // 100ms delay to ensure clean restart
        } catch (err) {
          console.error(`[StreamRestart] Error in restart process:`, err);
          socket.emit("error", {
            message: `Failed to restart streams: ${err.message}`,
            severity: "error",
          });
          isRestartingStreams = false;
        }
      };

      const onOperatorErrorCallback = (error) => {
        console.error("Operator recognition stream error:", error);

        // Check if this is the 305-second limit error (code 11)
        if (
          error.code === 11 ||
          (error.message && error.message.includes("305 seconds"))
        ) {
          console.log(
            "[StreamRestart] Operator stream exceeded 305-second limit, restarting both streams..."
          );
          restartStreams();
          return; // Don't emit error to client - streams are being restarted automatically
        }

        socket.emit("error", {
          message:
            error.message || "Operator speech recognition error occurred",
        });
      };

      const onCustomerErrorCallback = (error) => {
        console.error("Customer recognition stream error:", error);

        // Check if this is the 305-second limit error (code 11)
        if (
          error.code === 11 ||
          (error.message && error.message.includes("305 seconds"))
        ) {
          console.log(
            "[StreamRestart] Customer stream exceeded 305-second limit, restarting both streams..."
          );
          restartStreams();
          return; // Don't emit error to client - streams are being restarted automatically
        }

        socket.emit("error", {
          message:
            error.message || "Customer speech recognition error occurred",
        });
      };

      // Start operator recognition stream (from frontend mic)
      operatorStream = googleSpeechService.startStreamingRecognition(
        onOperatorTranscriptCallback,
        onOperatorErrorCallback
      );
      operatorStreamStartTime = Date.now();

      // Start customer recognition stream (from system audio)
      customerStream = googleSpeechService.startStreamingRecognition(
        onCustomerTranscriptCallback,
        onCustomerErrorCallback
      );
      customerStreamStartTime = Date.now();

      // Check if Aggregate Device is configured (preferred method)
      const aggregateConfigValid =
        aggregateAudioCapture.validateConfiguration();

      if (aggregateConfigValid) {
        // Use Aggregate Device - captures both operator (mic) and customer (BlackHole) audio
        console.log(
          `[AggregateAudio] Using Aggregate Device for dual-channel capture`
        );
        try {
          const aggregateHandle =
            aggregateAudioCapture.startAggregateAudioCapture(
              // Operator audio (mic channel from aggregate device)
              (operatorAudioChunk) => {
                if (operatorStream) {
                  const buffer = Buffer.isBuffer(operatorAudioChunk)
                    ? operatorAudioChunk
                    : Buffer.from(operatorAudioChunk);
                  operatorStream.write(buffer);
                }
              },
              // Customer audio (BlackHole channel from aggregate device)
              (customerAudioChunk) => {
                if (customerStream) {
                  const buffer = Buffer.isBuffer(customerAudioChunk)
                    ? customerAudioChunk
                    : Buffer.from(customerAudioChunk);
                  customerStream.write(buffer);
                }
              },
              (error) => {
                console.error("[AggregateAudio] Capture error:", error);

                // Create detailed error message
                let errorMessage = "Aggregate audio capture failed. ";
                let errorDetails = [];

                if (error.code) {
                  errorMessage += `[${error.code}] `;
                }

                if (error.message) {
                  errorMessage += error.message;
                } else if (error.originalError) {
                  errorMessage += error.originalError;
                } else {
                  errorMessage += error.toString();
                }

                if (error.details && Array.isArray(error.details)) {
                  errorDetails = error.details;
                }

                socket.emit("error", {
                  message: errorMessage,
                  details: errorDetails,
                  code: error.code || "AGGREGATE_AUDIO_ERROR",
                  type: error.type || "CAPTURE_ERROR",
                  severity: "warning",
                });
              }
            );
          aggregateAudioCaptures.set(socket.id, aggregateHandle);
          console.log(
            `[AggregateAudio] Started capture for socket: ${socket.id}`
          );

          // Notify frontend that Aggregate Device is being used
          // Frontend can skip mic capture and tab audio capture
          socket.emit("recognition-started", {
            audioSource: "aggregate-device",
            message:
              "Using Aggregate Device - no frontend audio capture needed",
          });

          // Note: When using aggregate device, frontend mic audio is not needed
          // The aggregate device provides both channels
        } catch (error) {
          console.error("[AggregateAudio] Failed to start capture:", error);

          // Extract error details if available
          let errorMessage =
            "Aggregate audio capture unavailable. Falling back to separate audio sources.";
          let errorDetails = [];

          if (error.code) {
            errorMessage += ` [${error.code}]`;
          }

          if (error.message) {
            errorMessage += ` ${error.message}`;
          } else {
            errorMessage += ` ${error.toString()}`;
          }

          if (error.details && Array.isArray(error.details)) {
            errorDetails = error.details;
          }

          socket.emit("error", {
            message: errorMessage,
            details: errorDetails,
            code: error.code || "AGGREGATE_AUDIO_INIT_ERROR",
            type: error.type || "INITIALIZATION_ERROR",
            severity: "warning",
            fallback:
              "Will attempt to use separate audio sources (frontend mic + system audio)",
          });

          // Fall through to system audio capture as fallback
        }
      } else {
        // Fallback: Use separate system audio capture (original method)
        console.log(
          `[SystemAudio] Using separate audio sources (frontend mic + system audio)`
        );
        const configValid = systemAudioCapture.validateConfiguration();

        if (configValid) {
          try {
            systemAudioCaptureHandle =
              systemAudioCapture.startSystemAudioCapture(
                (audioChunk) => {
                  // Convert audio chunk to buffer and send to customer stream
                  if (customerStream) {
                    // Audio chunk from node-record-lpcm16 should already be in LINEAR16 PCM format
                    // Convert to buffer if needed
                    const buffer = Buffer.isBuffer(audioChunk)
                      ? audioChunk
                      : Buffer.from(audioChunk);
                    customerStream.write(buffer);
                  }
                },
                (error) => {
                  console.error("[SystemAudio] Capture error:", error);
                  // Don't fail completely if system audio capture fails - operator stream still works
                  // This is expected if BlackHole device is not installed or configured
                  socket.emit("error", {
                    message:
                      "System audio capture failed. Operator audio still working. " +
                      "Ensure BlackHole is installed and SYSTEM_AUDIO_DEVICE is configured. " +
                      "Error: " +
                      error.message,
                    severity: "warning", // Non-fatal error
                  });
                }
              );
            systemAudioCaptures.set(socket.id, systemAudioCaptureHandle);
            console.log(
              `[SystemAudio] Started capture for socket: ${socket.id}`
            );
          } catch (error) {
            console.error("[SystemAudio] Failed to start capture:", error);
            // Continue without system audio capture - operator stream still works
            socket.emit("error", {
              message:
                "System audio capture unavailable. Only operator audio will be captured. " +
                "This is normal if BlackHole is not installed. Error: " +
                error.message,
              severity: "warning", // Non-fatal - fallback to diarization
            });
          }
        } else {
          console.warn(
            "[SystemAudio] Configuration invalid - skipping system audio capture"
          );
          socket.emit("error", {
            message:
              "System audio device not configured. Only operator audio will be captured. " +
              "Set SYSTEM_AUDIO_DEVICE or AGGREGATE_AUDIO_DEVICE environment variable to enable audio capture.",
            severity: "warning",
          });
        }
      }

      activeStreams.set(socket.id, {
        operator: operatorStream,
        customer: customerStream,
      });
      console.log(`Started dual recognition streams for socket: ${socket.id}`);

      // Only emit recognition-started if not already emitted by Aggregate Device handler
      if (!aggregateAudioCaptures.has(socket.id)) {
        socket.emit("recognition-started", {
          audioSource: "separate-sources",
          message: "Using separate audio sources (frontend mic + system audio)",
        });
      }
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
        {
          mode: context.mode || "sales", // Pass mode to AI service
        }
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
        mode: context.mode || "sales", // Pass mode to response generator
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

  // Handle audio chunks from frontend
  // Note: When using Aggregate Device, no frontend audio chunks are needed
  // Aggregate Device provides both operator and customer audio directly
  socket.on("audio-chunk", (data) => {
    try {
      const { audioData, audioSource } = data;

      // Validate audioSource
      if (
        !audioSource ||
        (audioSource !== "operator" && audioSource !== "customer")
      ) {
        console.warn(
          `Received audio chunk with invalid source: ${audioSource}. Expected 'operator' or 'customer'.`
        );
        return;
      }

      // Convert base64 to buffer (audioData is already LINEAR16 PCM in base64)
      const audioBuffer = Buffer.from(audioData, "base64");

      if (audioSource === "operator") {
        // Operator audio (microphone) -> operator stream
        // Note: This is only used as fallback when Aggregate Device is not configured
        if (!operatorStream) {
          console.warn(
            "Received operator audio chunk but no active operator recognition stream"
          );
          return;
        }
        operatorStream.write(audioBuffer);
      } else if (audioSource === "customer") {
        // Customer audio from frontend -> customer stream
        // Note: This is only used as fallback when Aggregate Device is not configured
        // When using Aggregate Device, customer audio comes from BlackHole channel
        if (!customerStream) {
          console.warn(
            "Received customer audio chunk but no active customer recognition stream"
          );
          return;
        }

        // If using Aggregate Device, ignore frontend customer audio
        if (aggregateAudioCaptures.has(socket.id)) {
          console.log(
            "[Audio] Ignoring frontend customer audio - using Aggregate Device instead"
          );
          return;
        }

        // Only process if not using Aggregate Device (fallback mode)
        customerStream.write(audioBuffer);
      }
    } catch (error) {
      console.error("Error processing audio chunk:", error);
      socket.emit("error", {
        message: "Error processing audio chunk: " + error.message,
      });
    }
  });

  // Note: Tab audio handlers removed - not needed when using Aggregate Device
  // Aggregate Device captures both operator and customer audio directly
  // Tab audio was only needed for browser-based Phone.com, which is no longer used

  // End recognition
  socket.on("end-recognition", () => {
    cleanup();
    socket.emit("recognition-ended");
  });

  // Cleanup function
  const cleanup = () => {
    // Stop aggregate audio capture (if using aggregate device)
    const aggregateHandle = aggregateAudioCaptures.get(socket.id);
    if (aggregateHandle) {
      try {
        aggregateHandle.stop();
      } catch (error) {
        console.error("Error stopping aggregate audio capture:", error);
      }
      aggregateAudioCaptures.delete(socket.id);
    }

    // Stop system audio capture (if using separate system audio)
    if (systemAudioCaptureHandle) {
      try {
        systemAudioCaptureHandle.stop();
      } catch (error) {
        console.error("Error stopping system audio capture:", error);
      }
      systemAudioCaptureHandle = null;
      systemAudioCaptures.delete(socket.id);
    }

    // Stop operator stream
    if (operatorStream) {
      try {
        operatorStream.end();
      } catch (error) {
        console.error("Error ending operator recognition stream:", error);
      }
      operatorStream = null;
    }

    // Stop customer stream
    if (customerStream) {
      try {
        customerStream.end();
      } catch (error) {
        console.error("Error ending customer recognition stream:", error);
      }
      customerStream = null;
    }

    activeStreams.delete(socket.id);
    conversationContexts.delete(socket.id);
    fullTranscript = "";
    extractedInfo = {};
    console.log(`Cleaned up recognition streams for socket: ${socket.id}`);
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

    // Generate pronunciation summary if segments exist
    if (
      context.pronunciationSegments &&
      context.pronunciationSegments.length > 0
    ) {
      try {
        const overallScore = pronunciationAnalysisService.calculateOverallScore(
          context.pronunciationSegments
        );
        const recommendations =
          await pronunciationAnalysisService.generateRecommendations(
            overallScore,
            context.pronunciationSegments,
            context.transcript
          );

        socket.emit("pronunciation-summary", {
          overallScore: overallScore.overallScore,
          segmentScores: context.pronunciationSegments.map((s) => ({
            score: s.score,
            segment: s.segment,
            timestamp: s.timestamp,
          })),
          recommendations: recommendations.recommendations,
          breakdown: overallScore.breakdown,
          syllableIssues: recommendations.syllableIssues,
          phoneticIssues: recommendations.phoneticIssues,
        });
      } catch (error) {
        console.error("Error generating pronunciation summary:", error);
        // Continue without blocking conversation save
      }
    }

    try {
      const duration = context.startTime
        ? Math.floor((Date.now() - context.startTime) / 1000)
        : null;

      const mode = context.mode || "sales";
      const isVendorMode = mode === "vendor";

      if (isVendorMode) {
        // Save vendor conversation to VendorConversationLog
        const vendorConversationData = {
          transcript: context.transcript,
          speakerCount: 2,
          wordCount: context.transcript.split(/\s+/).filter(Boolean).length,
          lineCount: context.transcript.split("\n").filter(Boolean).length,
          duration: duration,
          operatorId: socket.userId || null,
          operatorNotes: options.feedback || null,
          processed: false,
        };

        const savedLog = await vendorConversationLogRepository.create(
          vendorConversationData
        );

        // Trigger async processing for AI learning extraction
        processVendorConversationForLearning(savedLog._id).catch((err) => {
          console.error("Error processing vendor conversation:", err);
        });

        socket.emit("conversation-saved", {
          success: true,
          conversationId: savedLog._id,
          message:
            "Vendor conversation saved. AI will analyze and learn from this conversation.",
        });

        console.log(`Saved vendor conversation log for socket: ${socket.id}`);
      } else {
        // Save sales conversation to ConversationLog
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

        const savedLog = await conversationLogRepository.create(
          conversationData
        );

        socket.emit("conversation-saved", {
          success: true,
          conversationId: savedLog._id,
          message: "Conversation saved for AI learning",
        });

        console.log(`Saved conversation log for socket: ${socket.id}`);
      }
    } catch (error) {
      console.error("Error saving conversation log:", error);
      socket.emit("conversation-saved", {
        success: false,
        message: "Failed to save conversation",
        error: error.message,
      });
    }
  });

  /**
   * Process vendor conversation for AI learning extraction
   * This runs async after saving the conversation
   */
  async function processVendorConversationForLearning(conversationId) {
    try {
      const conversation = await vendorConversationLogRepository.findById(
        conversationId
      );
      if (!conversation || conversation.processed) return;

      // Use OpenAI to extract learnings from the conversation
      const extractedLearnings =
        await salesAssistService.extractVendorLearnings(
          conversation.transcript
        );

      await vendorConversationLogRepository.markAsProcessed(
        conversationId,
        extractedLearnings
      );

      console.log(
        `Processed vendor conversation ${conversationId} for learnings`
      );
    } catch (error) {
      console.error(
        `Error processing vendor conversation ${conversationId}:`,
        error
      );
    }
  }

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log(`Speech recognition client disconnected: ${socket.id}`);

    // Generate pronunciation summary on disconnect if segments exist
    const context = conversationContexts.get(socket.id);
    if (
      context &&
      context.pronunciationSegments &&
      context.pronunciationSegments.length > 0
    ) {
      try {
        const overallScore = pronunciationAnalysisService.calculateOverallScore(
          context.pronunciationSegments
        );
        const recommendations =
          await pronunciationAnalysisService.generateRecommendations(
            overallScore,
            context.pronunciationSegments,
            context.transcript || ""
          );

        socket.emit("pronunciation-summary", {
          overallScore: overallScore.overallScore,
          segmentScores: context.pronunciationSegments.map((s) => ({
            score: s.score,
            segment: s.segment,
            timestamp: s.timestamp,
          })),
          recommendations: recommendations.recommendations,
          breakdown: overallScore.breakdown,
          syllableIssues: recommendations.syllableIssues,
          phoneticIssues: recommendations.phoneticIssues,
        });
      } catch (error) {
        console.error(
          "Error generating pronunciation summary on disconnect:",
          error
        );
        // Continue with cleanup
      }
    }
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
