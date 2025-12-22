import mongoose from "mongoose";

/**
 * Conversation Log Schema
 * Stores all sales assist conversations for AI learning
 * Links to Lead for tracking sales conversions
 */
const ConversationLogSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // KEY CONNECTION - Links conversation to a Lead
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    index: true,
  },

  // Full conversation transcript
  transcript: {
    type: String,
    required: true,
  },

  // AI-extracted information from the conversation
  extractedInfo: {
    location: {
      city: String,
      state: String,
      zipCode: String,
      address: String,
    },
    eventType: String,
    quantity: Number,
    dates: {
      delivery: String,
      pickup: String,
    },
    intent: String,
    summary: String,
  },

  // Pricing quoted during conversation
  quotedPrice: {
    type: Number,
  },

  // Pricing breakdown provided
  pricingBreakdown: {
    units: {
      quantity: Number,
      pricePerUnit: Number,
      total: Number,
    },
    delivery: Number,
    fuelSurcharge: Number,
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    margin: Number,
    grandTotal: Number,
  },

  // Conversion tracking - auto-updated when orders are created
  outcome: {
    type: String,
    enum: ["pending", "converted", "lost", "callback", "no_sale"],
    default: "pending",
    index: true,
  },

  // TRUE = actual closed sale (SalesOrder + JobOrder exist)
  conversionSuccess: {
    type: Boolean,
    default: false,
    index: true,
  },

  // Set when SalesOrder is created for this lead
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesOrders",
  },

  // Set when JobOrder is created - confirms the sale!
  jobOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobOrders",
  },

  // Learning data - extracted patterns
  customerObjections: [
    {
      type: String,
    },
  ],

  successfulResponses: [
    {
      type: String,
    },
  ],

  // What worked well in this conversation
  effectiveTactics: [
    {
      type: String,
    },
  ],

  // Operator who handled the call
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },

  // Duration of the conversation (in seconds)
  duration: {
    type: Number,
  },

  // Confidence level of AI responses during conversation
  avgConfidence: {
    type: String,
    enum: ["high", "medium", "low"],
  },

  // Feedback for AI improvement
  operatorFeedback: {
    type: String,
  },

  // Whether the AI suggestions were helpful
  aiHelpful: {
    type: Boolean,
  },
});

// Indexes for efficient querying
ConversationLogSchema.index({ lead: 1, createdAt: -1 });
ConversationLogSchema.index({ conversionSuccess: 1, createdAt: -1 });
ConversationLogSchema.index({ outcome: 1, createdAt: -1 });
ConversationLogSchema.index({ operatorId: 1, createdAt: -1 });

// Compound indexes for learning queries
ConversationLogSchema.index({
  conversionSuccess: 1,
  "extractedInfo.eventType": 1,
  createdAt: -1,
});
ConversationLogSchema.index({
  conversionSuccess: 1,
  "extractedInfo.location.state": 1,
  createdAt: -1,
});

export default mongoose.models.ConversationLog ||
  mongoose.model("ConversationLog", ConversationLogSchema);
