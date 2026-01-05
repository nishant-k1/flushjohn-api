import mongoose from "mongoose";
/**
 * Vendor Conversation Log Schema
 * Stores vendor call transcripts for AI learning
 * AI learns tactics, phrases, and negotiation patterns from vendor sales people
 */
const VendorConversationLogSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    // Full conversation transcript
    transcript: {
        type: String,
        required: true,
    },
    // Metadata about the conversation
    speakerCount: {
        type: Number,
        default: 2,
    },
    wordCount: {
        type: Number,
    },
    lineCount: {
        type: Number,
    },
    duration: {
        type: Number, // in seconds
    },
    // AI-extracted learnings from the conversation
    extractedLearnings: {
        // Effective phrases used by vendor sales person
        effectivePhrases: [
            {
                type: String,
            },
        ],
        // Negotiation tactics identified
        negotiationTactics: [
            {
                type: String,
            },
        ],
        // Pricing strategies observed
        pricingStrategies: [
            {
                type: String,
            },
        ],
        // Objection handling techniques
        objectionHandling: [
            {
                type: String,
            },
        ],
        // Closing techniques
        closingTechniques: [
            {
                type: String,
            },
        ],
        // Tone and language style notes
        toneNotes: {
            type: String,
        },
    },
    // Whether AI has processed this conversation for learnings
    processed: {
        type: Boolean,
        default: false,
        index: true,
    },
    // Processing timestamp
    processedAt: {
        type: Date,
    },
    // Operator who recorded the call
    operatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    // Quality rating (operator feedback)
    qualityRating: {
        type: Number,
        min: 1,
        max: 5,
    },
    // Notes about what was useful in this conversation
    operatorNotes: {
        type: String,
    },
});
// Indexes for efficient querying
VendorConversationLogSchema.index({ processed: 1, createdAt: -1 });
VendorConversationLogSchema.index({ operatorId: 1, createdAt: -1 });
export default mongoose.models.VendorConversationLog ||
    mongoose.model("VendorConversationLog", VendorConversationLogSchema);
//# sourceMappingURL=VendorConversationLog.js.map