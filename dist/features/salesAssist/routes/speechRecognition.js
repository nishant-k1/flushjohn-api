/**
 * Speech Recognition Routes
 * Handles real-time audio streaming for Google Cloud Speech-to-Text
 */
import { Router } from "express";
import { authenticateToken } from "../../auth/middleware/auth.js";
import * as googleSpeechService from "../services/googleSpeechService.js";
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * GET /api/sales-assist/speech/status
 * Check if Google Cloud Speech-to-Text is configured
 */
router.get("/speech/status", (req, res) => {
    try {
        const isConfigured = googleSpeechService.isInitialized();
        res.status(200).json({
            success: true,
            configured: isConfigured,
            message: isConfigured
                ? "Google Cloud Speech-to-Text is configured"
                : "Google Cloud Speech-to-Text is not configured. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable.",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            configured: false,
            message: error.message,
        });
    }
});
/**
 * POST /api/sales-assist/speech/recognize
 * Process audio buffer for recognition (non-streaming)
 */
router.post("/speech/recognize", async (req, res) => {
    try {
        const { audioData } = req.body; // Base64 encoded audio data
        if (!audioData) {
            return res.status(400).json({
                success: false,
                message: "Audio data is required",
                error: "INVALID_REQUEST",
            });
        }
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioData, "base64");
        const result = await googleSpeechService.recognizeAudioBuffer(audioBuffer);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Error in speech recognition:", error);
        res.status(500).json({
            success: false,
            message: "Failed to recognize speech",
            error: error.message,
        });
    }
});
export default router;
//# sourceMappingURL=speechRecognition.js.map