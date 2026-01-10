import mongoose from "mongoose";

const QuotesSchema = new mongoose.Schema(
  {
    quoteNo: {
      type: Number,
      unique: true,
      required: true,
    },

    // ✅ MongoDB References (ObjectId) - New proper relationships
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },

    // Display numbers (NOT legacy - actively used in PDFs/emails)
    customerNo: {
      type: Number,
    },
    leadNo: {
      type: String,
      trim: true,
    },
    // ⚠️ REMOVED: leadId - Duplicate of lead ObjectId reference

    // Quote specific fields
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
      index: true,
    },
    emailStatus: {
      type: String,
      default: "Pending",
      trim: true,
    },
    // ⚠️ REMOVED: Contact fields - Use lead reference instead
    // Access via: quote.lead.fName, quote.lead.email, etc.

    products: {
      type: Array,
    },

    // Dates - Using Date type for proper Mongoose handling
    deliveryDate: {
      type: Date,
    },
    pickupDate: {
      type: Date,
    },

    // Contact person info
    contactPersonName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    contactPersonPhone: {
      type: String,
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
  }
);

// Add indexes for faster queries
QuotesSchema.index({ createdAt: -1 }); // Sort by date
// lead: index: true and customer: index: true already create indexes automatically
QuotesSchema.index({ emailStatus: 1 }); // Filter by status
QuotesSchema.index({ createdAt: -1, emailStatus: 1 }); // Compound index

export default mongoose.models.Quotes || mongoose.model("Quotes", QuotesSchema);
