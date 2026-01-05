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
    }
    catch (error) {
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
        startTime: null,
        mode: "sales", // Default to sales mode
    });
    // Start recognition
    socket.on("start-recognition", (options = {}) => {
        try {
            if (!googleSpeechService.isInitialized()) {
                socket.emit("error", {
                    message: "Google Cloud Speech-to-Text is not configured. Please set GOOGLE_CREDENTIALS_JSON environment variable.",
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
                    audioSource: "input_audio",
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
                            const wordLevelConfidence = data.alternatives?.[0]?.words?.map((w) => w.confidence) || [];
                            const pronunciationResult = await pronunciationAnalysisService.analyzePronunciation({
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
                        }
                        catch (error) {
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
                    audioSource: "output_audio",
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
                    console.log(`[StreamRestart] Already restarting streams, skipping duplicate restart`);
                    return;
                }
                console.log(`[StreamRestart] Restarting both streams due to 305-second limit`);
                isRestartingStreams = true;
                try {
                    // Close old streams
                    if (operatorStream) {
                        try {
                            operatorStream.end();
                        }
                        catch (err) {
                            console.error(`[StreamRestart] Error ending old operator stream:`, err);
                        }
                        operatorStream = null;
                    }
                    if (customerStream) {
                        try {
                            customerStream.end();
                        }
                        catch (err) {
                            console.error(`[StreamRestart] Error ending old customer stream:`, err);
                        }
                        customerStream = null;
                    }
                    // Small delay to ensure old streams are fully closed
                    setTimeout(() => {
                        try {
                            // Create new streams
                            operatorStream = googleSpeechService.startStreamingRecognition(onOperatorTranscriptCallback, onOperatorErrorCallback);
                            operatorStreamStartTime = Date.now();
                            customerStream = googleSpeechService.startStreamingRecognition(onCustomerTranscriptCallback, onCustomerErrorCallback);
                            customerStreamStartTime = Date.now();
                            // Update active streams map
                            activeStreams.set(socket.id, {
                                operator: operatorStream,
                                customer: customerStream,
                            });
                            console.log(`[StreamRestart] Both streams restarted successfully`);
                            socket.emit("stream-restarted", {
                                streamType: "both",
                                message: `Streams automatically restarted after 5-minute limit`,
                            });
                        }
                        catch (err) {
                            console.error(`[StreamRestart] Error restarting streams:`, err);
                            socket.emit("error", {
                                message: `Failed to restart streams: ${err.message}`,
                                severity: "error",
                            });
                        }
                        finally {
                            isRestartingStreams = false;
                        }
                    }, 100); // 100ms delay to ensure clean restart
                }
                catch (err) {
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
                if (error.code === 11 ||
                    (error.message && error.message.includes("305 seconds"))) {
                    console.log("[StreamRestart] Operator stream exceeded 305-second limit, restarting both streams...");
                    restartStreams();
                    return; // Don't emit error to client - streams are being restarted automatically
                }
                socket.emit("error", {
                    message: error.message || "Operator speech recognition error occurred",
                });
            };
            const onCustomerErrorCallback = (error) => {
                console.error("Customer recognition stream error:", error);
                // Check if this is the 305-second limit error (code 11)
                if (error.code === 11 ||
                    (error.message && error.message.includes("305 seconds"))) {
                    console.log("[StreamRestart] Customer stream exceeded 305-second limit, restarting both streams...");
                    restartStreams();
                    return; // Don't emit error to client - streams are being restarted automatically
                }
                socket.emit("error", {
                    message: error.message || "Customer speech recognition error occurred",
                });
            };
            // Start operator recognition stream (from frontend mic)
            operatorStream = googleSpeechService.startStreamingRecognition(onOperatorTranscriptCallback, onOperatorErrorCallback);
            operatorStreamStartTime = Date.now();
            // Start customer recognition stream (from frontend BlackHole/system audio)
            customerStream = googleSpeechService.startStreamingRecognition(onCustomerTranscriptCallback, onCustomerErrorCallback);
            customerStreamStartTime = Date.now();
            // Check if backend audio capture should be used (legacy mode)
            // Default: false - frontend captures both mic and BlackHole
            // Set USE_BACKEND_AUDIO_CAPTURE=true to use backend Aggregate Device/BlackHole capture
            const useBackendAudioCapture = process.env.USE_BACKEND_AUDIO_CAPTURE === "true";
            if (useBackendAudioCapture) {
                // Legacy mode: Backend captures audio (Aggregate Device or BlackHole)
                // Check if Aggregate Device is configured (preferred method)
                const aggregateConfigValid = aggregateAudioCapture.validateConfiguration();
                if (aggregateConfigValid) {
                    // Use Aggregate Device - captures both operator (mic) and customer (BlackHole) audio
                    console.log(`[AggregateAudio] Using Aggregate Device for dual-channel capture`);
                    try {
                        const aggregateHandle = aggregateAudioCapture.startAggregateAudioCapture(
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
                        }, (error) => {
                            console.error("[AggregateAudio] Capture error:", error);
                            // Don't emit errors for platform/configuration issues
                            // These are expected on deployed servers where Aggregate Device is not available
                            const isPlatformError = error.code === "PLATFORM_NOT_SUPPORTED" ||
                                error.code === "AUDIO_DEVICE_ERROR" ||
                                error.type === "PLATFORM_ERROR";
                            if (isPlatformError) {
                                console.log("[AggregateAudio] Platform/configuration error - stopping aggregate capture, will use fallback");
                                // Stop the aggregate capture and let the fallback handle it
                                try {
                                    if (aggregateHandle && aggregateHandle.stop) {
                                        aggregateHandle.stop();
                                    }
                                    aggregateAudioCaptures.delete(socket.id);
                                }
                                catch (stopError) {
                                    console.error("[AggregateAudio] Error stopping capture:", stopError);
                                }
                                return; // Don't emit error to client
                            }
                            // Create detailed error message for other errors
                            let errorMessage = "Aggregate audio capture failed. ";
                            let errorDetails = [];
                            if (error.code) {
                                errorMessage += `[${error.code}] `;
                            }
                            if (error.message) {
                                errorMessage += error.message;
                            }
                            else if (error.originalError) {
                                errorMessage += error.originalError;
                            }
                            else {
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
                        });
                        aggregateAudioCaptures.set(socket.id, aggregateHandle);
                        console.log(`[AggregateAudio] Started capture for socket: ${socket.id}`);
                        // Notify frontend that Aggregate Device is being used
                        // Frontend can skip mic capture and tab audio capture
                        socket.emit("recognition-started", {
                            audioSource: "aggregate-device",
                            message: "Using Aggregate Device - no frontend audio capture needed",
                        });
                        // Note: When using aggregate device, frontend mic audio is not needed
                        // The aggregate device provides both channels
                    }
                    catch (error) {
                        console.error("[AggregateAudio] Failed to start capture:", error);
                        // Extract error details if available
                        let errorMessage = "Aggregate audio capture unavailable. Falling back to separate audio sources.";
                        let errorDetails = [];
                        if (error.code) {
                            errorMessage += ` [${error.code}]`;
                        }
                        if (error.message) {
                            errorMessage += ` ${error.message}`;
                        }
                        else {
                            errorMessage += ` ${error.toString()}`;
                        }
                        if (error.details && Array.isArray(error.details)) {
                            errorDetails = error.details;
                        }
                        // Don't emit error to client if this is a platform/configuration issue
                        // This is expected on deployed servers (Linux) where Aggregate Device is not available
                        // Only log it and continue with fallback
                        const isPlatformError = error.code === "PLATFORM_NOT_SUPPORTED" ||
                            error.code === "AUDIO_DEVICE_ERROR" ||
                            error.type === "PLATFORM_ERROR";
                        if (isPlatformError) {
                            console.log("[AggregateAudio] Platform/configuration issue - silently falling back to separate audio sources");
                            // Don't emit error - this is expected behavior on non-macOS systems
                        }
                        else {
                            // For other errors (like SOX_NOT_INSTALLED), emit as warning
                            socket.emit("error", {
                                message: errorMessage,
                                details: errorDetails,
                                code: error.code || "AGGREGATE_AUDIO_INIT_ERROR",
                                type: error.type || "INITIALIZATION_ERROR",
                                severity: "warning",
                                fallback: "Will attempt to use separate audio sources (frontend mic + system audio)",
                            });
                        }
                        // Fall through to system audio capture as fallback
                    }
                }
                else {
                    // Fallback: Use separate system audio capture (original method)
                    console.log(`[SystemAudio] Using separate audio sources (frontend mic + system audio)`);
                    const configValid = systemAudioCapture.validateConfiguration();
                    if (configValid) {
                        try {
                            systemAudioCaptureHandle =
                                systemAudioCapture.startSystemAudioCapture((audioChunk) => {
                                    // Convert audio chunk to buffer and send to customer stream
                                    if (customerStream) {
                                        // Audio chunk from node-record-lpcm16 should already be in LINEAR16 PCM format
                                        // Convert to buffer if needed
                                        const buffer = Buffer.isBuffer(audioChunk)
                                            ? audioChunk
                                            : Buffer.from(audioChunk);
                                        customerStream.write(buffer);
                                    }
                                }, (error) => {
                                    console.error("[SystemAudio] Capture error:", error);
                                    // Don't fail completely if system audio capture fails - operator stream still works
                                    // This is expected if BlackHole device is not installed or configured
                                    socket.emit("error", {
                                        message: "System audio capture failed. Operator audio still working. " +
                                            "Ensure BlackHole is installed and SYSTEM_AUDIO_DEVICE is configured. " +
                                            "Error: " +
                                            error.message,
                                        severity: "warning", // Non-fatal error
                                    });
                                });
                            systemAudioCaptures.set(socket.id, systemAudioCaptureHandle);
                            console.log(`[SystemAudio] Started capture for socket: ${socket.id}`);
                        }
                        catch (error) {
                            console.error("[SystemAudio] Failed to start capture:", error);
                            // Continue without system audio capture - operator stream still works
                            socket.emit("error", {
                                message: "System audio capture unavailable. Only operator audio will be captured. " +
                                    "This is normal if BlackHole is not installed. Error: " +
                                    error.message,
                                severity: "warning", // Non-fatal - will only capture operator audio
                            });
                        }
                    }
                    else {
                        console.warn("[SystemAudio] Configuration invalid - skipping system audio capture");
                        socket.emit("error", {
                            message: "System audio device not configured. Only operator audio will be captured. " +
                                "Set SYSTEM_AUDIO_DEVICE or AGGREGATE_AUDIO_DEVICE environment variable to enable audio capture.",
                            severity: "warning",
                        });
                    }
                }
            }
            else {
                // Default mode: Frontend captures both mic and BlackHole
                // Backend just receives both streams via audio-chunk events
                console.log(`[FrontendAudio] Using frontend audio capture (mic + BlackHole)`);
                socket.emit("recognition-started", {
                    audioSource: "frontend-capture",
                    message: "Using frontend audio capture. Make sure BlackHole is installed and selected.",
                });
            }
            activeStreams.set(socket.id, {
                operator: operatorStream,
                customer: customerStream,
            });
            console.log(`Started dual recognition streams for socket: ${socket.id}`);
        }
        catch (error) {
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
        if (isGeneratingResponse)
            return;
        isGeneratingResponse = true;
        try {
            // First, analyze the conversation to extract info
            const analysisResult = await salesAssistService.analyzeConversation(context.transcript, {
                mode: context.mode || "sales", // Pass mode to AI service
            });
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
            // Emit the operator response
            socket.emit("operator-response", {
                response: responseResult.response,
                pricingBreakdown: responseResult.pricingBreakdown,
                nextAction: responseResult.nextAction,
                confidence: responseResult.confidence,
                extractedInfo: context.extractedInfo,
            });
            console.log(`Generated AI response for socket: ${socket.id}`);
        }
        catch (error) {
            console.error("Error generating AI response:", error);
            socket.emit("ai-error", {
                message: "Failed to generate response suggestion",
                error: error.message,
            });
        }
        finally {
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
            if (!audioSource ||
                (audioSource !== "input_audio" && audioSource !== "output_audio")) {
                console.warn(`Received audio chunk with invalid source: ${audioSource}. Expected 'input_audio' or 'output_audio'.`);
                return;
            }
            // Convert base64 to buffer (audioData is already LINEAR16 PCM in base64)
            const audioBuffer = Buffer.from(audioData, "base64");
            if (audioSource === "input_audio") {
                // Input audio (microphone) from frontend -> operator stream
                if (!operatorStream) {
                    console.warn("Received input_audio chunk but no active operator recognition stream");
                    return;
                }
                // If using backend audio capture (Aggregate Device), ignore frontend input_audio
                const useBackendAudioCapture = process.env.USE_BACKEND_AUDIO_CAPTURE === "true";
                if (useBackendAudioCapture &&
                    aggregateAudioCaptures.has(socket.id)) {
                    console.log("[Audio] Ignoring frontend input_audio - using Aggregate Device instead");
                    return;
                }
                // Process frontend input_audio
                operatorStream.write(audioBuffer);
            }
            else if (audioSource === "output_audio") {
                // Output audio from frontend (BlackHole/system audio) -> customer stream
                if (!customerStream) {
                    console.warn("Received output_audio chunk but no active customer recognition stream");
                    return;
                }
                // If using backend audio capture (Aggregate Device or systemAudioCapture), ignore frontend output_audio
                const useBackendAudioCapture = process.env.USE_BACKEND_AUDIO_CAPTURE === "true";
                if (useBackendAudioCapture &&
                    (aggregateAudioCaptures.has(socket.id) ||
                        systemAudioCaptures.has(socket.id))) {
                    console.log("[Audio] Ignoring frontend output_audio - using backend capture instead");
                    return;
                }
                // Process frontend output_audio
                customerStream.write(audioBuffer);
            }
        }
        catch (error) {
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
    socket.on("end-recognition", async () => {
        await cleanup();
        socket.emit("recognition-ended");
    });
    // Cleanup function - now auto-saves before cleanup
    const cleanup = async () => {
        // Auto-save conversation before cleanup if transcript exists
        const context = conversationContexts.get(socket.id);
        if (context && context.transcript && context.transcript.length >= 20) {
            try {
                const duration = context.startTime
                    ? Math.floor((Date.now() - context.startTime) / 1000)
                    : null;
                const mode = context.mode || "sales";
                const isVendorMode = mode === "vendor";
                if (isVendorMode) {
                    // Save vendor conversation
                    const vendorConversationData = {
                        transcript: context.transcript,
                        speakerCount: 2,
                        wordCount: context.transcript.split(/\s+/).filter(Boolean).length,
                        lineCount: context.transcript.split("\n").filter(Boolean).length,
                        duration: duration,
                        operatorId: socket.userId || null,
                        operatorNotes: null,
                        processed: false,
                    };
                    const savedLog = await vendorConversationLogRepository.create(vendorConversationData);
                    // Trigger async processing for AI learning extraction
                    processVendorConversationForLearning(savedLog._id).catch((err) => {
                        console.error("Error processing vendor conversation:", err);
                    });
                    console.log(`Auto-saved vendor conversation for socket: ${socket.id}`);
                }
                else {
                    // Save sales conversation
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
                        outcome: "pending",
                        operatorId: socket.userId || null,
                        duration: duration,
                        operatorFeedback: null,
                        aiHelpful: null,
                    };
                    const savedLog = await conversationLogRepository.create(conversationData);
                    // Trigger async processing for AI learning extraction
                    processSalesConversationForLearning(savedLog._id).catch((err) => {
                        console.error("Error processing sales conversation:", err);
                    });
                    console.log(`Auto-saved sales conversation for socket: ${socket.id}`);
                }
            }
            catch (error) {
                console.error("Error auto-saving conversation on cleanup:", error);
                // Continue with cleanup even if save fails
            }
        }
        // Stop aggregate audio capture (if using aggregate device)
        const aggregateHandle = aggregateAudioCaptures.get(socket.id);
        if (aggregateHandle) {
            try {
                aggregateHandle.stop();
            }
            catch (error) {
                console.error("Error stopping aggregate audio capture:", error);
            }
            aggregateAudioCaptures.delete(socket.id);
        }
        // Stop system audio capture (if using separate system audio)
        if (systemAudioCaptureHandle) {
            try {
                systemAudioCaptureHandle.stop();
            }
            catch (error) {
                console.error("Error stopping system audio capture:", error);
            }
            systemAudioCaptureHandle = null;
            systemAudioCaptures.delete(socket.id);
        }
        // Stop operator stream
        if (operatorStream) {
            try {
                operatorStream.end();
            }
            catch (error) {
                console.error("Error ending operator recognition stream:", error);
            }
            operatorStream = null;
        }
        // Stop customer stream
        if (customerStream) {
            try {
                customerStream.end();
            }
            catch (error) {
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
        if (context.pronunciationSegments &&
            context.pronunciationSegments.length > 0) {
            try {
                const overallScore = pronunciationAnalysisService.calculateOverallScore(context.pronunciationSegments);
                const recommendations = await pronunciationAnalysisService.generateRecommendations(overallScore, context.pronunciationSegments, context.transcript);
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
            }
            catch (error) {
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
                const savedLog = await vendorConversationLogRepository.create(vendorConversationData);
                // Trigger async processing for AI learning extraction
                processVendorConversationForLearning(savedLog._id).catch((err) => {
                    console.error("Error processing vendor conversation:", err);
                });
                socket.emit("conversation-saved", {
                    success: true,
                    conversationId: savedLog._id,
                    message: "Vendor conversation saved. AI will analyze and learn from this conversation.",
                });
                console.log(`Saved vendor conversation log for socket: ${socket.id}`);
            }
            else {
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
            }
        }
        catch (error) {
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
            const conversation = await vendorConversationLogRepository.findById(conversationId);
            if (!conversation || conversation.processed)
                return;
            // Use OpenAI to extract learnings from the conversation
            const extractedLearnings = await salesAssistService.extractVendorLearnings(conversation.transcript);
            await vendorConversationLogRepository.markAsProcessed(conversationId, extractedLearnings);
            console.log(`Processed vendor conversation ${conversationId} for learnings`);
        }
        catch (error) {
            console.error(`Error processing vendor conversation ${conversationId}:`, error);
        }
    }
    /**
     * Process sales conversation for AI learning extraction
     * This runs async after saving the conversation
     */
    async function processSalesConversationForLearning(conversationId) {
        try {
            const conversation = await conversationLogRepository.findById(conversationId);
            if (!conversation || conversation.processed)
                return;
            // Use OpenAI to extract learnings from the conversation
            const extractedLearnings = await salesAssistService.extractSalesLearnings(conversation.transcript);
            await conversationLogRepository.markAsProcessed(conversationId, extractedLearnings);
            console.log(`Processed sales conversation ${conversationId} for learnings`);
        }
        catch (error) {
            console.error(`Error processing sales conversation ${conversationId}:`, error);
        }
    }
    // Handle disconnect
    socket.on("disconnect", async () => {
        console.log(`Speech recognition client disconnected: ${socket.id}`);
        // Generate pronunciation summary on disconnect if segments exist
        const context = conversationContexts.get(socket.id);
        if (context &&
            context.pronunciationSegments &&
            context.pronunciationSegments.length > 0) {
            try {
                const overallScore = pronunciationAnalysisService.calculateOverallScore(context.pronunciationSegments);
                const recommendations = await pronunciationAnalysisService.generateRecommendations(overallScore, context.pronunciationSegments, context.transcript || "");
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
            }
            catch (error) {
                console.error("Error generating pronunciation summary on disconnect:", error);
                // Continue with cleanup
            }
        }
        await cleanup();
    });
    // Handle errors
    socket.on("error", async (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
        await cleanup();
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
//# sourceMappingURL=speechRecognition.js.map