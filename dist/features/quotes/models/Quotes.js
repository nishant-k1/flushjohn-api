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
    // Display numbers (NOT legacy - actively used in PDFs/emails)
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
    // Quote specific fields
    emailStatus: {
        type: String,
        default: "Pending",
    },
    // ⚠️ REMOVED: Contact fields - Use lead reference instead
    // fName, lName, cName, email, phone, fax, address fields, usageType
    // Access via: quote.lead.fName, quote.lead.email, etc.
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
// lead: index: true and customer: index: true already create indexes automatically
QuotesSchema.index({ emailStatus: 1 }); // Filter by status
QuotesSchema.index({ createdAt: -1, emailStatus: 1 }); // Compound index
export default mongoose.models.Quotes || mongoose.model("Quotes", QuotesSchema);
//# sourceMappingURL=Quotes.js.map