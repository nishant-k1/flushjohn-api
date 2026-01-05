/**
 * Pronunciation Analysis Service
 * Analyzes operator speech for pronunciation accuracy and provides scoring/recommendations
 */
/**
 * Analyze pronunciation for a single segment
 * @param {Object} params
 * @param {Buffer} params.audioChunk - Audio data chunk
 * @param {string} params.transcript - Transcribed text
 * @param {number} params.confidence - Google Speech API confidence score (0-1)
 * @param {Array} params.wordLevelConfidence - Word-level confidence scores
 * @returns {Object} - Pronunciation analysis result
 */
export declare const analyzePronunciation: ({ audioChunk, transcript, confidence, wordLevelConfidence, }: {
    audioChunk: any;
    transcript: any;
    confidence: any;
    wordLevelConfidence?: any[];
}) => Promise<{
    score: number;
    confidence: any;
    segment: any;
    timestamp: number;
    wordAnalysis: {
        words: any;
        averageScore: number;
        lowConfidenceWords: any;
    };
    syllableAnalysis: {
        words: any;
        accuracy: number;
        totalSyllables: any;
    };
    phoneticAnalysis: {
        words: any;
        issues: any[];
        accuracy: number;
    };
    adjustments: {
        totalAdjustment: number;
        adjustments: any[];
    };
    error?: undefined;
} | {
    score: number;
    confidence: any;
    segment: any;
    timestamp: number;
    error: any;
    wordAnalysis?: undefined;
    syllableAnalysis?: undefined;
    phoneticAnalysis?: undefined;
    adjustments?: undefined;
}>;
/**
 * Calculate overall score from multiple segments
 * @param {Array} segments - Array of pronunciation analysis results
 * @returns {Object} - Overall score and breakdown
 */
export declare const calculateOverallScore: (segments: any) => {
    overallScore: number;
    segmentCount: any;
    breakdown: {
        confidence: number;
        fluency: number;
        naturalness: number;
        syllableAccuracy: number;
        phoneticAccuracy: number;
    };
};
/**
 * Generate recommendations based on analysis
 * @param {Object} overallScore - Overall score result
 * @param {Array} segments - All segment analyses
 * @param {string} fullTranscript - Full conversation transcript
 * @returns {Object} - Recommendations
 */
export declare const generateRecommendations: (overallScore: any, segments: any, fullTranscript: any) => Promise<{
    recommendations: any[];
    syllableIssues: any[];
    phoneticIssues: any[];
}>;
//# sourceMappingURL=pronunciationAnalysisService.d.ts.map