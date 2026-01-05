/**
 * Google Cloud Speech-to-Text Service
 * Handles real-time speech recognition
 * Note: Speaker identification is done via audio source (input_audio/output_audio), not diarization
 */
/**
 * Create a streaming recognition request configuration
 * @returns {Object} Recognition configuration
 */
export declare const createRecognitionConfig: () => {
    encoding: string;
    sampleRateHertz: number;
    languageCode: string;
    enableAutomaticPunctuation: boolean;
    model: string;
    useEnhanced: boolean;
};
/**
 * Start a streaming recognition session
 * @param {Function} onTranscript - Callback for transcript updates
 * @param {Function} onError - Callback for errors
 * @returns {Object} StreamingRecognizeClient and request configuration
 */
export declare const startStreamingRecognition: (onTranscript: any, onError: any) => {
    stream: any;
    write: (audioChunk: any) => void;
    end: () => void;
};
/**
 * Process audio buffer for recognition
 * Audio should be in LINEAR16 format, 16kHz, mono
 * @param {Buffer} audioBuffer - Audio data buffer
 * @returns {Promise<Object>} Recognition results
 */
export declare const recognizeAudioBuffer: (audioBuffer: any) => Promise<{
    success: boolean;
    results: any;
}>;
/**
 * Check if Google Cloud Speech client is initialized
 * @returns {boolean}
 */
export declare const isInitialized: () => boolean;
//# sourceMappingURL=googleSpeechService.d.ts.map