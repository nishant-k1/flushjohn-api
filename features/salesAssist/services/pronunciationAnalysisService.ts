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
export const analyzePronunciation = async ({
  audioChunk,
  transcript,
  confidence,
  wordLevelConfidence = [],
}) => {
  try {
    // Base score from Google Speech API confidence
    let baseScore = confidence * 5; // Convert 0-1 to 0-5 scale

    // Analyze word-level pronunciation
    const wordAnalysis = await analyzeWordLevelPronunciation(
      transcript,
      wordLevelConfidence
    );

    // Analyze syllables
    const syllableAnalysis = await analyzeSyllables(transcript);

    // Analyze phonetics (basic - can be enhanced with IPA library)
    const phoneticAnalysis = await analyzePhonetics(transcript);

    // Calculate adjustments
    const adjustments = calculateAdjustments(
      wordAnalysis,
      syllableAnalysis,
      phoneticAnalysis
    );

    // Final score calculation
    const finalScore = Math.min(
      5,
      Math.max(1, baseScore + adjustments.totalAdjustment)
    );

    return {
      score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
      confidence: confidence,
      segment: transcript,
      timestamp: Date.now(),
      wordAnalysis: wordAnalysis,
      syllableAnalysis: syllableAnalysis,
      phoneticAnalysis: phoneticAnalysis,
      adjustments: adjustments,
    };
  } catch (error) {
    console.error("Error in analyzePronunciation:", error);
    return {
      score: 3.0, // Default score on error
      confidence: confidence || 0.5,
      segment: transcript,
      timestamp: Date.now(),
      error: error.message,
    };
  }
};

/**
 * Calculate overall score from multiple segments
 * @param {Array} segments - Array of pronunciation analysis results
 * @returns {Object} - Overall score and breakdown
 */
export const calculateOverallScore = (segments) => {
  if (!segments || segments.length === 0) {
    return {
      overallScore: 3.0,
      segmentCount: 0,
      breakdown: {
        confidence: 3.0,
        fluency: 3.0,
        naturalness: 3.0,
        syllableAccuracy: 3.0,
        phoneticAccuracy: 3.0,
      },
    };
  }

  const scores = segments.map((s) => s.score || 3.0);
  const confidences = segments.map((s) => s.confidence || 0.5);

  // Calculate averages
  const overallScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const avgConfidence =
    confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

  // Calculate breakdown metrics
  const syllableScores = segments
    .map((s) => s.syllableAnalysis?.accuracy || 3.0)
    .filter((s) => s > 0);
  const phoneticScores = segments
    .map((s) => s.phoneticAnalysis?.accuracy || 3.0)
    .filter((s) => s > 0);

  const syllableAccuracy =
    syllableScores.length > 0
      ? syllableScores.reduce((sum, s) => sum + s, 0) / syllableScores.length
      : 3.0;
  const phoneticAccuracy =
    phoneticScores.length > 0
      ? phoneticScores.reduce((sum, s) => sum + s, 0) / phoneticScores.length
      : 3.0;

  // Estimate fluency and naturalness from score patterns
  const fluency = Math.min(5, overallScore + 0.2); // Slightly optimistic
  const naturalness = Math.min(5, overallScore + 0.1);

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    segmentCount: segments.length,
    breakdown: {
      confidence: Math.round(avgConfidence * 5 * 10) / 10, // Convert to 1-5 scale
      fluency: Math.round(fluency * 10) / 10,
      naturalness: Math.round(naturalness * 10) / 10,
      syllableAccuracy: Math.round(syllableAccuracy * 10) / 10,
      phoneticAccuracy: Math.round(phoneticAccuracy * 10) / 10,
    },
  };
};

/**
 * Analyze word-level pronunciation
 * @param {string} transcript - Transcribed text
 * @param {Array} wordLevelConfidence - Word-level confidence scores
 * @returns {Object} - Word analysis
 */
const analyzeWordLevelPronunciation = async (
  transcript,
  wordLevelConfidence
) => {
  const words = transcript.split(/\s+/).filter((w) => w.length > 0);
  const wordScores = words.map((word, index) => {
    const confidence = wordLevelConfidence[index] || 0.7;
    return {
      word: word,
      confidence: confidence,
      score: confidence * 5, // Convert to 1-5 scale
    };
  });

  const avgScore =
    wordScores.reduce((sum, w) => sum + w.score, 0) / wordScores.length;

  return {
    words: wordScores,
    averageScore: Math.round(avgScore * 10) / 10,
    lowConfidenceWords: wordScores.filter((w) => w.confidence < 0.6),
  };
};

/**
 * Analyze syllables in transcript
 * @param {string} transcript - Transcribed text
 * @returns {Object} - Syllable analysis
 */
const analyzeSyllables = async (transcript) => {
  const words = transcript.split(/\s+/).filter((w) => w.length > 0);

  // Simple syllable counting (can be enhanced with library)
  const syllableData = words.map((word) => {
    const syllableCount = estimateSyllableCount(word);
    return {
      word: word,
      syllableCount: syllableCount,
      // Note: Stress pattern detection would require more sophisticated analysis
      // This is a placeholder for future enhancement
    };
  });

  // Calculate accuracy (simplified - assumes multi-syllable words are harder)
  const multiSyllableWords = syllableData.filter((w) => w.syllableCount > 1);
  const accuracy =
    multiSyllableWords.length > 0
      ? Math.min(5, 3 + (multiSyllableWords.length / words.length) * 2)
      : 3.0;

  return {
    words: syllableData,
    accuracy: Math.round(accuracy * 10) / 10,
    totalSyllables: syllableData.reduce((sum, w) => sum + w.syllableCount, 0),
  };
};

/**
 * Estimate syllable count for a word (simple heuristic)
 * @param {string} word - Word to analyze
 * @returns {number} - Estimated syllable count
 */
const estimateSyllableCount = (word) => {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;

  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = /[aeiouy]/.test(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent 'e' at end
  if (word.endsWith("e") && count > 1) {
    count--;
  }

  return Math.max(1, count);
};

/**
 * Analyze phonetics in transcript
 * @param {string} transcript - Transcribed text
 * @returns {Object} - Phonetic analysis
 */
const analyzePhonetics = async (transcript) => {
  // This is a simplified version
  // Full phonetic analysis would require IPA transcription library
  const words = transcript.split(/\s+/).filter((w) => w.length > 0);

  // Detect common accent patterns (simplified)
  const issues = [];
  words.forEach((word) => {
    // Check for common substitutions (simplified detection)
    if (word.includes("th") && word.length < 5) {
      // Potential /θ/ or /ð/ sound
      issues.push({
        word: word,
        type: "phoneme",
        note: "Check 'th' sound pronunciation",
      });
    }
  });

  // Calculate accuracy (simplified)
  const accuracy =
    issues.length > 0 ? Math.max(2.5, 5 - issues.length * 0.3) : 4.0;

  return {
    words: words,
    issues: issues,
    accuracy: Math.round(accuracy * 10) / 10,
  };
};

/**
 * Calculate score adjustments based on analysis
 * @param {Object} wordAnalysis - Word-level analysis
 * @param {Object} syllableAnalysis - Syllable analysis
 * @param {Object} phoneticAnalysis - Phonetic analysis
 * @returns {Object} - Adjustments to apply
 */
const calculateAdjustments = (
  wordAnalysis,
  syllableAnalysis,
  phoneticAnalysis
) => {
  let totalAdjustment = 0;
  const adjustments = [];

  // Word-level adjustments
  if (wordAnalysis.averageScore > 4.0) {
    totalAdjustment += 0.2;
    adjustments.push({ type: "word_confidence", value: +0.2 });
  } else if (wordAnalysis.averageScore < 3.0) {
    totalAdjustment -= 0.3;
    adjustments.push({ type: "word_confidence", value: -0.3 });
  }

  // Syllable adjustments
  if (syllableAnalysis.accuracy > 4.0) {
    totalAdjustment += 0.15;
    adjustments.push({ type: "syllable_accuracy", value: +0.15 });
  } else if (syllableAnalysis.accuracy < 3.0) {
    totalAdjustment -= 0.2;
    adjustments.push({ type: "syllable_accuracy", value: -0.2 });
  }

  // Phonetic adjustments
  if (phoneticAnalysis.accuracy > 4.0) {
    totalAdjustment += 0.15;
    adjustments.push({ type: "phonetic_accuracy", value: +0.15 });
  } else if (phoneticAnalysis.accuracy < 3.0) {
    totalAdjustment -= 0.2;
    adjustments.push({ type: "phonetic_accuracy", value: -0.2 });
  }

  // Penalize for many low-confidence words
  if (wordAnalysis.lowConfidenceWords.length > 3) {
    totalAdjustment -= 0.3;
    adjustments.push({ type: "low_confidence_words", value: -0.3 });
  }

  return {
    totalAdjustment: totalAdjustment,
    adjustments: adjustments,
  };
};

/**
 * Generate recommendations based on analysis
 * @param {Object} overallScore - Overall score result
 * @param {Array} segments - All segment analyses
 * @param {string} fullTranscript - Full conversation transcript
 * @returns {Object} - Recommendations
 */
export const generateRecommendations = async (
  overallScore,
  segments,
  fullTranscript
) => {
  const recommendations = [];
  const syllableIssues = [];
  const phoneticIssues = [];

  // Analyze segments for issues
  segments.forEach((segment) => {
    // Syllable issues
    if (segment.syllableAnalysis?.words) {
      segment.syllableAnalysis.words.forEach((wordData) => {
        if (wordData.syllableCount > 2) {
          // Multi-syllable words might need attention
          syllableIssues.push({
            word: wordData.word,
            issue: "Multi-syllable word - check stress pattern",
            syllableCount: wordData.syllableCount,
          });
        }
      });
    }

    // Phonetic issues
    if (segment.phoneticAnalysis?.issues) {
      segment.phoneticAnalysis.issues.forEach((issue) => {
        phoneticIssues.push({
          word: issue.word,
          issue: issue.note || issue.type,
        });
      });
    }
  });

  // Generate general recommendations based on score
  if (overallScore.overallScore < 3.5) {
    recommendations.push({
      type: "general",
      priority: "high",
      message: "Focus on pronunciation clarity. Speak slowly and clearly.",
    });
  }

  if (overallScore.breakdown.syllableAccuracy < 3.5) {
    recommendations.push({
      type: "syllable",
      priority: "medium",
      message: "Practice stress patterns on multi-syllable words.",
    });
  }

  if (overallScore.breakdown.phoneticAccuracy < 3.5) {
    recommendations.push({
      type: "phonetic",
      priority: "medium",
      message: "Work on specific sound pronunciations (e.g., 'th' sounds).",
    });
  }

  if (overallScore.breakdown.fluency < 3.5) {
    recommendations.push({
      type: "fluency",
      priority: "medium",
      message: "Improve speaking flow and natural pauses.",
    });
  }

  // Add specific word recommendations
  if (syllableIssues.length > 0) {
    recommendations.push({
      type: "specific_words",
      priority: "low",
      message: `Practice these multi-syllable words: ${syllableIssues
        .slice(0, 5)
        .map((i) => i.word)
        .join(", ")}`,
      words: syllableIssues.slice(0, 5),
    });
  }

  return {
    recommendations: recommendations,
    syllableIssues: syllableIssues.slice(0, 10), // Limit to top 10
    phoneticIssues: phoneticIssues.slice(0, 10), // Limit to top 10
  };
};
