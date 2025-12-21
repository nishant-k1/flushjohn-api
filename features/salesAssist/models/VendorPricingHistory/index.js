import mongoose from "mongoose";

/**
 * Vendor Pricing History Schema
 * Stores actual vendor quotes to learn and improve pricing accuracy
 */
const VendorPricingHistorySchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendors",
    required: true,
    index: true,
  },

  vendorName: {
    type: String,
  },

  // Location details
  zipCode: {
    type: String,
    index: true,
  },
  city: {
    type: String,
    index: true,
  },
  state: {
    type: String,
    index: true,
  },

  // Quote details
  eventType: {
    type: String,
    enum: [
      "construction",
      "event",
      "wedding",
      "festival",
      "party",
      "conference",
      "sports",
      "outdoor",
      "other",
    ],
  },

  quantity: {
    type: Number,
    required: true,
  },

  // Pricing details
  pricePerUnit: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  additionalCharges: {
    type: Number,
    default: 0,
  },

  // Quote metadata
  quotedDate: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
  },
  quotedBy: {
    type: String, // Vendor representative name or contact
  },
  notes: {
    type: String,
  },

  // Source of the quote
  source: {
    type: String,
    enum: ["manual_call", "email", "vendor_portal", "historical_job"],
    default: "manual_call",
  },

  // Whether this quote was used/selected
  wasUsed: {
    type: Boolean,
    default: false,
  },
  usedInJobOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobOrders",
  },

  // AI suggested price vs actual price comparison
  aiSuggestedPrice: {
    type: Number,
  },
  priceDifference: {
    type: Number, // actual - suggested
  },
  accuracyRating: {
    type: Number, // percentage accuracy
  },
});

// Indexes for efficient querying
VendorPricingHistorySchema.index({ vendorId: 1, zipCode: 1, createdAt: -1 });
VendorPricingHistorySchema.index({ zipCode: 1, eventType: 1, createdAt: -1 });
VendorPricingHistorySchema.index({ city: 1, state: 1, createdAt: -1 });

export default mongoose.models.VendorPricingHistory ||
  mongoose.model("VendorPricingHistory", VendorPricingHistorySchema);
