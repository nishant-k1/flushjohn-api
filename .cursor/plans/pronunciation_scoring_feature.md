# Real-Time Pronunciation Scoring Feature

## Overview

Add a real-time pronunciation scoring system that rates how close the operator sounds to native American English (1-5 scale), with final recommendations at conversation end.

**IMPORTANT**: This analyzes the OPERATOR's actual speech (what they say), NOT the AI-suggested text. The syllable/phonetic analysis appears in separate UI components, not in the AI response suggestions.

## CRITICAL REQUIREMENT: Phonetic-Style AI Suggestions

**AI suggestions must be written in phonetic-style spelling** (not standard spelling) to help operators pronounce words like native Americans.

**Example**:

- ❌ Standard: "I am going to the store"
- ✅ Phonetic: "Ahm goin' tuh thuh store"

This phonetic spelling represents how words actually sound in casual American English, making it easier for operators to mimic native pronunciation. Keep it natural and readable - no stress markers or excessive formatting needed.

## CRITICAL REQUIREMENT: Continuous Learning from Vendor Reps

**The system must continuously learn from vendor conversations and apply those learnings to sales assist suggestions.**

### How It Works:

1. **Vendor Conversation Analysis**:

   - Every vendor conversation is automatically analyzed after completion
   - Extracts: effective phrases, negotiation tactics, pricing strategies, objection handling, closing techniques, tone notes
   - Stores learnings in `VendorConversationLog` with extracted data

2. **Learning Application**:

   - Top effective phrases and tactics from vendor conversations are retrieved
   - These learnings are included in sales assist AI prompts
   - **CRITICAL**: Vendor learnings must be converted to phonetic-style spelling when used in sales suggestions
   - System continuously improves by learning what works from vendor interactions

3. **Bidirectional Learning**:
   - Vendor conversations → Learn effective techniques → Apply to sales calls
   - Sales conversations → Learn successful patterns → Improve future suggestions
   - Both feed into the AI's knowledge base for better suggestions

## Architecture

### Backend Components

1. **Pronunciation Analysis Service** (`features/salesAssist/services/pronunciationAnalysisService.js`)

   - Analyze operator audio segments
   - Score pronunciation on 1-5 scale
   - Track metrics: confidence, fluency, accent patterns
   - Generate recommendations

2. **Scoring Algorithm** (Hybrid approach)

   - Use Google Speech API confidence scores
   - Analyze word-level pronunciation patterns
   - Compare against native American speech patterns
   - Consider: stress patterns, intonation, rhythm, clarity

3. **Socket Events**

   - `pronunciation-score`: Real-time score updates
   - `pronunciation-summary`: Final summary at conversation end

4. **Data Storage**
   - Store scores per conversation segment
   - Aggregate final scores and recommendations
   - Link to conversation logs

### Frontend Components

1. **Real-Time Score Display** (SalesAssistModal)

   - Visual scale indicator (1-5 stars/bars)
   - Color-coded (red/yellow/green)
   - Updates as operator speaks
   - Position: Top-right corner or sidebar

2. **Final Results Panel**
   - Overall score (1-5)
   - Breakdown by category:
     - Pronunciation clarity
     - Natural flow/rhythm
     - Phrase usage
     - Sentence structure
   - Specific recommendations:
     - Words/phrases to improve
     - Pronunciation tips
     - Sentence framing suggestions

## Implementation Plan

### Phase 0: Update AI Prompts for Phonetic-Style Spelling + Vendor Learning (CRITICAL)

**File**: `features/salesAssist/services/salesAssistService.js`

**Changes Required**:

1. **Update `getVendorLearningsContext` function** (lines 931-962):

   - **NEW**: Convert vendor learnings to phonetic-style spelling before including in prompts
   - When vendor phrases/tactics are retrieved, they should be presented in phonetic format
   - Example: Vendor says "I can definitely help with that" → Include as "Ah kin definitly help with that" in sales prompts
   - This ensures operators learn to say vendor-proven phrases with native pronunciation

2. **Update LANGUAGE & ACCENT REQUIREMENTS section** (lines 734-741, 688-695):

   - Add explicit instruction to use phonetic-style spelling
   - Provide comprehensive examples of conversions
   - Keep it natural and readable - no stress markers needed
   - Maintain readability while showing pronunciation

3. **Add Phonetic Spelling Guidelines**:

```
CRITICAL: PHONETIC-STYLE SPELLING REQUIRED
- Write ALL responses in phonetic spelling that shows how native Americans actually pronounce words
- Use phonetic spelling, NOT standard spelling
- Examples:
  * "I am" → "Ahm" or "I'm"
  * "going to" → "goin' tuh" or "gonna"
  * "the" → "thuh" (before consonants) or "thee" (before vowels)
  * "you" → "ya" or "yuh" (casual)
  * "want to" → "wanna"
  * "have to" → "hafta"
  * "got to" → "gotta"
  * "about" → "uh-bout" or "bout"
  * "because" → "cuz" or "cause"
  * "probably" → "probly" or "prolly"
  * "delivery" → "delivree" or "duhlivree"
  * "definitely" → "definitly" or "definitlee"
  * "absolutely" → "absolutly" or "absolootly"
- Use apostrophes naturally for dropped sounds: "goin'", "nothin'", "comin'"
- Keep it natural and readable - don't overcomplicate
- Balance phonetic accuracy with readability
```

4. **Add Natural Human Conversation Patterns**:

```
CRITICAL: SOUND LIKE A REAL HUMAN, NOT AN AI

AVOID OVERLY FORMAL/STRUCTURED PATTERNS:
- "I understand your concern" → More natural: "Gotcha" or "I see"
- "Let me assist you" → More natural: "Lemme help ya"
- "I would be happy to help" → More natural: "Yeah, we kin help ya out"
- "Based on your requirements" → More natural: "So tell me whatcha need"
- Overly long, perfectly structured sentences → Mix with shorter, conversational ones

USE NATURAL CONVERSATIONAL PATTERNS:
- Use natural transitions: "So", "Alright", "Well", "Yeah", "Okay"
- Mix short and medium sentences (vary length)
- Use contractions naturally: "we're", "you're", "that's", "doesn't"
- Start sentences with conjunctions when natural: "And", "But", "So"
- Use simple acknowledgments: "Yeah", "Right", "Gotcha", "Sounds good"
- Keep it conversational, not scripted

SENTENCE FRAMING EXAMPLES:
- "I understand you need porta potties for your event. I can help you with that."
  → "Oh yeah, we kin help ya out with that. What kinda event ya got goin' on?"

- "Based on your requirements, I can provide you with a quote."
  → "Alright, so tell me a bit more 'bout whatcha need, an' I'll git ya a price."

- "I would be happy to assist you with delivery arrangements."
  → "Yeah, we kin handle the delivery. When're ya needin' 'em?"

- "Let me check our availability for those dates."
  → "Lemme check on that real quick. What dates were ya thinkin'?"

CONVERSATIONAL FLOW:
- Respond to what customer just said (not generic)
- Use back-channeling: "Yeah", "Right", "Gotcha", "Mmm-hmm"
- Ask follow-up questions naturally: "Oh really?", "How many people?", "Where's that at?"
- Show understanding: "Ah, I see", "Okay, so...", "Right, so..."
- Be conversational, not transactional
- Sound like you're having a real conversation, not reading a script
```

5. **Update RESPONSE FORMAT section**:

```
"response": "The exact words in PHONETIC SPELLING the operator should say. Must sound like a real human conversation, not an AI. Use natural sentence framing, conversational flow, and avoid robotic patterns. Example: 'Oh yeah, we kin definitly help ya out with that. What kinda event ya got goin' on?'"
```

6. **Update user prompt** (line 819):

```
Generate the next response in PHONETIC-STYLE SPELLING that shows how native Americans actually pronounce the words.
Example: "Oh yeah, we kin definitly help ya out with that" instead of "I can definitely help you with that".

CRITICAL REQUIREMENTS:
1. Use phonetic spelling (e.g., "Ahm goin' tuh help ya" not "I am going to help you")
2. Sound like a REAL HUMAN having a conversation, NOT an AI assistant
3. Use natural sentence framing - avoid formal/robotic patterns
4. Include conversational elements: "Oh yeah", "Alright", "So", "Gotcha"
5. Vary sentence length and structure
6. Use contractions and casual language naturally
7. Keep it natural and readable - no stress markers or excessive formatting

AVOID:
- Overly formal language ("I understand your concern" → "Gotcha" or "I see")
- Repetitive sentence patterns
- Too structured/scripted sounding

IMPORTANT: When using phrases learned from vendor conversations, convert them to phonetic spelling and keep them conversational.
For example, if vendor learning says "I can definitely help with that", use "Yeah, we kin definitly help ya out with that" (phonetic + natural).
```

5. **Update `getVendorLearningsContext` to convert to phonetic spelling**:

```javascript
export const getVendorLearningsContext = async () => {
  try {
    const [phrases, tactics] = await Promise.all([
      vendorConversationLogRepository.getEffectivePhrases(15),
      vendorConversationLogRepository.getNegotiationTactics(10),
    ]);

    if (!phrases.length && !tactics.length) {
      return "";
    }

    let context =
      "\nLEARNED FROM VENDOR CONVERSATIONS (apply these techniques in PHONETIC SPELLING):\n";

    if (phrases.length > 0) {
      context += `\nEffective phrases to use (convert to phonetic when using):\n${phrases
        .map((p) => `- "${p}" → Use phonetic version in response`)
        .join("\n")}\n`;
    }

    if (tactics.length > 0) {
      context += `\nNegotiation tactics (apply with phonetic spelling):\n${tactics
        .map((t) => `- ${t}`)
        .join("\n")}\n`;
    }

    context += `\nCRITICAL: When incorporating vendor-learned phrases into your response, convert them to phonetic-style spelling.\n`;

    return context;
  } catch (error) {
    console.error("Error getting vendor learnings context:", error);
    return "";
  }
};
```

**Testing**:

- Verify AI generates phonetic spelling consistently
- Check readability - should still be understandable
- Ensure natural flow without excessive formatting
- Test with various sentence types
- **NEW**: Verify vendor-learned phrases are converted to phonetic spelling in sales suggestions
- **NEW**: Test that vendor conversations are being analyzed and learnings are being applied
- **NEW**: Verify continuous learning - check that new vendor conversations update the learning context
- **NEW**: Verify responses sound like real human conversation, not AI
- **NEW**: Check that sentence framing varies naturally (not repetitive)
- **NEW**: Ensure conversational elements are included naturally
- **NEW**: Verify avoidance of typical AI patterns (formal language, overly structured sentences)

### Phase 1: Backend Analysis Service

**File**: `features/salesAssist/services/pronunciationAnalysisService.js`

**Functions**:

- `analyzePronunciation(audioChunk, transcript, confidence)`: Score individual segment
- `calculateOverallScore(segments)`: Aggregate scores
- `generateRecommendations(scores, transcript)`: AI-powered recommendations
- `detectAccentPatterns(transcript, confidence)`: Identify non-native patterns
- `analyzeSyllables(word, transcript)`: Analyze syllable count, stress, timing
- `analyzePhonetics(word, audioData)`: IPA transcription, phoneme accuracy
- `compareToNativePatterns(word, syllables, phonetics)`: Compare against native American patterns
- `generatePhoneticFeedback(word, expectedPhonetics, actualPhonetics)`: Specific phonetic corrections

**Scoring Criteria** (1-5 scale):

- 5: Native-like (natural flow, perfect pronunciation)
- 4: Near-native (minor accent, very clear)
- 3: Good (clear but noticeable accent)
- 2: Needs improvement (accent affects clarity)
- 1: Poor (difficult to understand)

**Metrics to Track**:

- Speech confidence (from Google API)
- Word-level confidence scores
- Speaking rate (words per minute)
- Pause patterns
- Stress/intonation patterns
- Phrase naturalness
- **Syllable Analysis**:
  - Syllable count per word
  - Syllable stress patterns (primary/secondary stress)
  - Syllable timing and rhythm
  - Multi-syllable word pronunciation accuracy
- **Phonetic Analysis**:
  - IPA (International Phonetic Alphabet) transcription
  - Phoneme accuracy (vowel/consonant quality)
  - Vowel formant analysis (if available from audio)
  - Consonant clarity (plosives, fricatives, etc.)
  - Phonetic stress patterns
  - Sound substitution detection (common accent patterns)

### Phase 2: Socket Integration

**File**: `features/salesAssist/sockets/speechRecognition.js`

**Changes**:

- Import pronunciation analysis service
- Analyze operator audio segments in real-time
- Emit `pronunciation-score` events
- Store scores in conversation context
- Generate final summary on conversation end

**New Socket Events**:

```javascript
socket.emit("pronunciation-score", {
  score: 4.2, // 1-5
  segment: "current phrase",
  confidence: 0.95,
  timestamp: Date.now(),
  syllableAnalysis: {
    word: "delivery",
    syllableCount: 4,
    stressPattern: "de-LIV-ery", // Correct pattern (for analysis only)
    detectedStress: "DE-livery", // What was detected
    issues: ["Incorrect primary stress"]
  },
  phoneticAnalysis: {
    word: "delivery",
    expectedIPA: "/dɪˈlɪvəri/",
    detectedIPA: "/ˈdelɪvəri/",
    phonemeAccuracy: 0.85,
    issues: ["Stress on wrong syllable", "Vowel quality in first syllable"]
  }
});

socket.emit("pronunciation-summary", {
  overallScore: 4.1,
  segmentScores: [...],
  recommendations: [...],
  breakdown: {
    confidence: 4.2,
    fluency: 4.0,
    naturalness: 4.1,
    syllableAccuracy: 3.8,
    phoneticAccuracy: 4.0
  },
  syllableIssues: [
    {
      word: "delivery",
      issue: "Incorrect stress",
      correct: "de-LIV-ery",
      detected: "DE-livery"
    }
  ],
  phoneticIssues: [
    {
      word: "think",
      expected: "/θɪŋk/",
      detected: "/tɪŋk/",
      issue: "/θ/ sound replaced with /t/",
      recommendation: "Practice 'th' sound: place tongue between teeth"
    }
  ]
});
```

### Phase 3: Frontend Real-Time Display

**File**: `src/features/salesAssist/components/SalesAssistModal/index.js`

**New Components**:

1. **PronunciationScoreIndicator** (real-time)

   - 5-star or bar scale
   - Color: Red (1-2), Yellow (3), Green (4-5)
   - Updates smoothly
   - Position: Top-right corner

2. **PronunciationSummaryPanel** (end of conversation)
   - Expandable/collapsible
   - Shows overall score
   - Breakdown charts
   - Recommendations list
   - Actionable tips

**State Management**:

- `pronunciationScore`: Current real-time score
- `pronunciationHistory`: Array of segment scores
- `pronunciationSummary`: Final summary object

### Phase 4: Recommendations Engine

**File**: `features/salesAssist/services/pronunciationAnalysisService.js`

**Recommendation Types**:

1. **Pronunciation Issues**:

   - Specific words mispronounced
   - Vowel/consonant corrections
   - Stress pattern adjustments
   - **Syllable-level feedback**:
     - Incorrect syllable stress (e.g., "DE-livery" vs "de-LIV-ery")
     - Missing syllables or added syllables
     - Syllable timing issues (too fast/slow)
     - Multi-syllable word breakdown
   - **Phonetic-level feedback**:
     - IPA transcription comparison (expected vs actual)
     - Specific phoneme corrections (e.g., /θ/ vs /t/, /r/ vs /l/)
     - Vowel quality issues (e.g., /æ/ vs /ɑ/)
     - Consonant clarity problems
     - Sound substitution patterns (common accent markers)

2. **Phrase Improvements**:

   - Suggest more natural American phrases
   - Replace formal with casual professional
   - Add natural fillers where appropriate
   - **NEW**: Identify and replace AI-sounding phrases with human alternatives
   - **NEW**: Suggest conversational transitions and back-channeling

3. **Sentence Framing**:
   - Improve sentence structure to sound more human
   - Better flow and rhythm
   - Natural pause placement
   - **NEW**: Vary sentence length and structure (avoid repetitive patterns)
   - **NEW**: Use natural human conversation patterns
   - **NEW**: Include conversational elements: "Oh yeah", "Alright", "So", "Gotcha"
   - **NEW**: Avoid overly structured or formal sentence framing
   - **NEW**: Suggest natural transitions and acknowledgments

**AI-Powered Recommendations**:

- Use OpenAI to analyze transcript
- Compare against native American patterns
- Generate specific, actionable feedback

## File Structure

```
features/salesAssist/
  services/
    pronunciationAnalysisService.js (NEW)
  sockets/
    speechRecognition.js (MODIFY - add scoring)

src/features/salesAssist/components/
  SalesAssistModal/
    index.js (MODIFY - add score display)
    PronunciationScoreIndicator.jsx (NEW)
    PronunciationSummaryPanel.jsx (NEW)
```

## UI/UX Design

### Real-Time Score Indicator

- **Location**: Top-right of Sales Assist modal header (next to "LIVE" indicator)
- **Size**: Compact, non-intrusive
- **Display**:
  - 5 bars/stars (filled based on score)
  - Current score number (e.g., "4.2/5")
  - Color indicator (Red 1-2, Yellow 3, Green 4-5)
- **Animation**: Smooth transitions on score changes
- **What it shows**: Overall pronunciation score (1-5) based on operator's actual speech
- **What it does NOT show**: Detailed syllable/phonetic breakdown (too much info for real-time)

### Final Summary Panel

- **Trigger**: When conversation ends or user clicks "View Analysis" button
- **Layout**: Expandable panel at bottom of modal (below transcript area)
- **Sections**:

  1. **Overall Score** (large, prominent)

     - Final score: 4.1/5 ⭐⭐⭐⭐☆
     - Color-coded visual indicator

  2. **Score Breakdown** (bar charts)

     - Confidence: 4.2
     - Fluency: 4.0
     - Naturalness: 4.1
     - Syllable Accuracy: 3.8 ⚠️
     - Phonetic Accuracy: 4.0

  3. **Syllable Analysis Section** (Detailed breakdown)

     - List of words with syllable issues
     - For each word:
       - Word: "delivery"
       - You said: "DE-livery" (visual with stress marker)
       - Should be: "de-LIV-ery" (visual with correct stress)
       - Visual syllable breakdown: de • LIV • er • y
       - Practice tip: "Emphasize the second syllable"

  4. **Phonetic Analysis Section** (Detailed breakdown)

     - List of words with phonetic issues
     - For each word:
       - Word: "think"
       - Expected IPA: /θɪŋk/
       - You said IPA: /tɪŋk/
       - Issue: "/θ/ sound replaced with /t/"
       - Recommendation: "Practice 'th' sound: place tongue between teeth"
       - Visual comparison of phonemes

  5. **Recommendations** (bulleted list with icons)

     - General pronunciation tips
     - Specific words to practice
     - Sentence framing improvements

  6. **Practice Tips** (actionable items)
     - Links to practice exercises
     - Common patterns to focus on

**Key Point**: The syllable/phonetic details appear ONLY in this final summary panel, NOT in the AI-suggested responses or real-time display.

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: AI Generates Suggestion                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ "Oh yeah, we kin definitly git that delivree     │  │
│  │  set up for ya. What dates were ya thinkin'?"    │  │
│  │ (Phonetic spelling + human conversation patterns) │  │
│  └─────────────────────────────────────────────────┘  │
│  ↓                                                      │
│  Displayed in: "SAY THIS" green box                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 2: Operator Reads AI Suggestion                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Operator says: "Hey there! We can get that       │  │
│  │ delivery set up." (analyzed for pronunciation)   │  │
│  └─────────────────────────────────────────────────┘  │
│  ↓                                                      │
│  Audio captured from operator's microphone              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 3: System Analyzes Operator's Speech              │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Google Speech API → Transcript                  │  │
│  │ Syllable Analysis → Detects stress patterns     │  │
│  │ Phonetic Analysis → /dɪˈlɪvəri/ vs /ˈdelɪvəri/ │  │
│  │ Calculate Score → 4.1/5                         │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 4: Real-Time Display (Top-Right Corner)           │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Score: 4.1/5] ⭐⭐⭐⭐☆                          │  │
│  │ (Simple score, NO detailed breakdown)           │  │
│  └─────────────────────────────────────────────────┘  │
│  Updates as operator speaks                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  STEP 5: Final Summary (When Conversation Ends)         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📊 Pronunciation Analysis                        │  │
│  │                                                  │  │
│  │ Overall: 4.1/5 ⭐⭐⭐⭐☆                         │  │
│  │                                                  │  │
│  │ 🔍 Syllable Issues:                              │  │
│  │ • "delivery": Incorrect stress pattern          │  │
│  │                                                  │  │
│  │ 🔊 Phonetic Issues:                              │  │
│  │ • "think": /tɪŋk/ → /θɪŋk/                      │  │
│  │                                                  │  │
│  │ 💡 Recommendations:                              │  │
│  │ • Practice stress patterns                      │  │
│  └─────────────────────────────────────────────────┘  │
│  Expandable panel at bottom of modal                    │
└─────────────────────────────────────────────────────────┘
```

## Key Points

1. **AI Suggestions** (Green "SAY THIS" box):

   - Contains: **Phonetic-style spelling** (e.g., "Oh yeah, we kin definitly help ya out with that")
   - Purpose: Help operator pronounce words like native Americans AND sound like a real human
   - Format: Natural phonetic spelling + human conversation patterns, NOT standard spelling or AI patterns
   - Examples:
     - "I am going to help you with that" → "Oh yeah, we kin help ya out with that"
     - "I understand your concern" → "Gotcha, I see whatcha mean"
     - "I would be happy to assist" → "Yeah, we kin definitely do that"
     - "Based on your requirements" → "Alright, so tell me whatcha need"
   - **Key Requirements**:
     - Phonetic spelling (native pronunciation)
     - Natural human conversation patterns
     - Conversational flow (not robotic)
     - Varied sentence structure
     - Natural transitions and acknowledgments
   - Does NOT contain: Detailed syllable/phonetic analysis (that's in final summary)

2. **Real-Time Score** (Top-right corner):

   - Contains: Simple 1-5 score (e.g., "4.2/5")
   - Does NOT contain: Detailed syllable/phonetic breakdown
   - Purpose: Quick feedback as operator speaks

3. **Final Summary** (Bottom panel):
   - Contains: Detailed syllable/phonetic analysis
   - Shows: Word-by-word breakdown with IPA, stress patterns
   - Purpose: Comprehensive feedback and recommendations

## Scoring Algorithm Details

### Base Score Calculation

```javascript
baseScore = (confidence * 0.3) + (fluency * 0.25) + (naturalness * 0.25) + (syllableAccuracy * 0.1) + (phoneticAccuracy * 0.1)

// Syllable Scoring:
- Correct stress pattern: +0.15 per word
- Incorrect stress: -0.2 per word
- Natural syllable timing: +0.1
- Rushed/slurred syllables: -0.15

// Phonetic Scoring:
- Correct phoneme pronunciation: +0.1 per phoneme
- Phoneme substitution (common accent): -0.1 per phoneme
- Vowel quality match: +0.15
- Consonant clarity: +0.1

// Adjustments:
- Native phrase usage: +0.2
- Natural contractions: +0.1
- Appropriate pauses: +0.1
- Non-native patterns: -0.3
- Unclear pronunciation: -0.5
- Syllable stress errors: -0.2 per word
- Phonetic inaccuracies: -0.15 per word
```

### Syllable Analysis Details

**Syllable Detection**:

- Use library like `syllable` or `natural` for syllable counting
- Identify primary stress (ˈ) and secondary stress (ˌ)
- Compare against CMU Pronouncing Dictionary or similar
- Track syllable timing from audio duration

**Common Issues to Detect**:

- Wrong stress: "DE-livery" (should be "de-LIV-ery")
- Missing syllables: "probly" (should be "prob-a-bly")
- Added syllables: "ath-a-lete" (should be "ath-lete")
- Timing: Rushed multi-syllable words

### Phonetic Analysis Details

**Phonetic Transcription**:

- Use CMU Pronouncing Dictionary for expected IPA
- Compare with Google Speech API word-level data
- Analyze formant frequencies (if audio analysis available)
- Detect common substitutions:
  - /θ/ → /t/ or /s/ (think → tink/sink)
  - /ð/ → /d/ (this → dis)
  - /r/ → /l/ or omitted (red → led)
  - Vowel quality shifts (/æ/ → /ɑ/, /ɪ/ → /i/)

**Phonetic Feedback Format**:

```
Word: "delivery"
Expected: /dɪˈlɪvəri/
Actual: /ˈdelɪvəri/ (stress on wrong syllable)
Issue: Primary stress should be on second syllable
Recommendation: Practice emphasizing the second syllable
```

### Recommendation Generation

- Analyze low-scoring segments
- Identify specific words/phrases
- Compare against native patterns
- Generate actionable feedback
- **Syllable-specific recommendations**:
  - Show correct syllable breakdown
  - Highlight stressed syllables
  - Provide practice exercises for multi-syllable words
- **Phonetic-specific recommendations**:
  - Show IPA comparison (expected vs actual)
  - Highlight problem phonemes
  - Provide phonetic practice tips
  - Link to audio examples if available

## Testing Considerations

- Test with various accent levels
- Verify real-time updates are smooth
- Check final summary accuracy
- Validate recommendations are actionable
- Test UI responsiveness

## Dependencies/Libraries Needed

**Backend**:

- `syllable` or `natural` - For syllable counting
- CMU Pronouncing Dictionary data - For IPA and stress patterns
- Phonetic analysis library (if available) or custom implementation
- Audio analysis tools (optional, for formant analysis)

**Frontend**:

- IPA font support for displaying phonetic symbols
- Chart library for breakdown visualization
- Audio playback for pronunciation examples (optional)

## Continuous Learning System

### Vendor Conversation Learning Flow

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Vendor Conversation Occurs                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Operator talks with vendor sales rep            │  │
│  │ Conversation is transcribed and logged          │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Automatic Learning Extraction                 │
│  ┌─────────────────────────────────────────────────┐  │
│  │ extractVendorLearnings() analyzes transcript    │  │
│  │ Extracts:                                        │  │
│  │ • Effective phrases                             │  │
│  │ • Negotiation tactics                            │  │
│  │ • Pricing strategies                             │  │
│  │ • Objection handling                             │  │
│  │ • Closing techniques                             │  │
│  │ • Tone notes                                     │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Learning Storage                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Stored in VendorConversationLog                  │  │
│  │ Top phrases/tactics ranked by effectiveness      │  │
│  │ Available for retrieval via repository methods   │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Application to Sales Assist                   │
│  ┌─────────────────────────────────────────────────┐  │
│  │ getVendorLearningsContext() retrieves top        │  │
│  │ effective phrases and tactics                    │  │
│  │                                                  │  │
│  │ CRITICAL: Converted to phonetic spelling         │  │
│  │ Example: "I can definitely help"                 │  │
│  │          → "Ah kin definitly help"               │  │
│  │                                                  │  │
│  │ Included in sales assist AI prompts              │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  STEP 5: Sales Assist Uses Learned Phrases             │
│  ┌─────────────────────────────────────────────────┐  │
│  │ AI generates suggestions using:                  │  │
│  │ • Vendor-learned effective phrases                │  │
│  │ • In phonetic-style spelling                     │  │
│  │ • Applied to customer conversations                │  │
│  │                                                  │  │
│  │ Result: Operator uses proven vendor techniques    │  │
│  │         with native pronunciation                 │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

**File**: `features/salesAssist/services/salesAssistService.js`

**Current Implementation**:

- ✅ `extractVendorLearnings()` - Extracts learnings from vendor conversations
- ✅ `getVendorLearningsContext()` - Retrieves top phrases/tactics
- ✅ Vendor learnings are included in sales assist prompts (line 661-664)
- ⚠️ **NEEDS UPDATE**: Vendor learnings should be converted to phonetic spelling

**Required Updates**:

1. **Update `getVendorLearningsContext()`**:

   - Add instruction to convert vendor phrases to phonetic spelling
   - Ensure AI understands to apply phonetic conversion when using vendor-learned phrases

2. **Enhance Learning Extraction**:

   - Track which vendor phrases are most effective
   - Rank phrases by success rate in sales conversations
   - Continuously update top phrases based on performance

3. **Phonetic Conversion Helper** (Optional):
   - Create helper function to convert standard phrases to phonetic spelling
   - Can be used when vendor learnings are retrieved
   - Ensures consistency in phonetic representation

## Future Enhancements

- Historical tracking (improvement over time)
- Practice mode with specific phrases
- Voice coaching tips
- Regional accent preferences
- Custom scoring weights
- Interactive syllable/phonetic practice
- Audio playback of correct pronunciations
- Real-time syllable/phonetic highlighting as operator speaks
- **NEW**: Machine learning model to rank vendor-learned phrases by effectiveness
- **NEW**: A/B testing of vendor-learned phrases in sales conversations
- **NEW**: Automatic phonetic conversion of vendor-learned phrases
- **NEW**: Learning analytics dashboard showing which vendor techniques work best
