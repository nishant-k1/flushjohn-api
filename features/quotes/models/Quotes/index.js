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
  // ⚠️ REMOVED: leadId - Duplicate of lead ObjectId reference
  // leadId: {
  //   type: String,
  // },

  emailStatus: {
    type: String,
    default: "Pending",
  },
  // ⚠️ REMOVED: fName, lName, cName - Use customer/lead reference instead
  // fName: {
  //   type: String,
  // },
  // lName: {
  //   type: String,
  // },
  // cName: {
  //   type: String,
  // },
  // ⚠️ REMOVED: email, phone, fax - Use customer/lead reference instead
  // email: {
  //   type: String,
  // },
  // phone: {
  //   type: String,
  // },
  // fax: {
  //   type: String,
  // },

  // ⚠️ REMOVED: streetAddress, city, state, zip, country - Use customer/lead reference instead
  // streetAddress: {
  //   type: String,
  // },
  // city: {
  //   type: String,
  // },
  // state: {
  //   type: String,
  // },
  // zip: {
  //   type: String,
  // },
  // country: {
  //   type: String,
  //   default: "USA",
  // },

  // ⚠️ REMOVED: usageType - Use lead reference instead
  // usageType: {
  //   type: String,
  // },
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
// ⚠️ REMOVED: QuotesSchema.index({ email: 1 }); // Email field removed
QuotesSchema.index({ lead: 1 }); // Find by lead reference
QuotesSchema.index({ emailStatus: 1 }); // Filter by status
QuotesSchema.index({ createdAt: -1, emailStatus: 1 }); // Compound index

export default mongoose.models.Quotes || mongoose.model("Quotes", QuotesSchema);
