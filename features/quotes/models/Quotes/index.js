import mongoose from "mongoose";

const QuotesSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
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

  // 🔄 Legacy fields (kept for backward compatibility during migration)
  customerNo: {
    type: Number,
  },
  leadNo: {
    type: String,
  },
  leadId: {
    type: String,
  },

  emailStatus: {
    type: String,
    default: "Pending",
  },
  fName: {
    type: String,
  },
  lName: {
    type: String,
  },
  cName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  fax: {
    type: String,
  },

  streetAddress: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zip: {
    type: String,
  },
  country: {
    type: String,
    default: "USA",
  },

  usageType: {
    type: String,
  },
  products: {
    type: Array,
  },
  deliveryDate: {
    type: String,
  },
  pickupDate: {
    type: String,
  },
  contactPersonName: {
    type: String,
  },
  contactPersonPhone: {
    type: String,
  },
  instructions: {
    type: String,
  },

  note: {
    type: String,
  },
});

// Add indexes for faster queries
QuotesSchema.index({ createdAt: -1 }); // Sort by date
QuotesSchema.index({ email: 1 }); // Find by email
QuotesSchema.index({ lead: 1 }); // Find by lead reference
QuotesSchema.index({ emailStatus: 1 }); // Filter by status
QuotesSchema.index({ createdAt: -1, emailStatus: 1 }); // Compound index

export default mongoose.models.Quotes || mongoose.model("Quotes", QuotesSchema);
