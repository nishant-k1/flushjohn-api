import mongoose from "mongoose";
/**
 * Payments Schema
 * Tracks all payment transactions for sales orders
 */
const PaymentsSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    // References
    salesOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesOrders",
        required: true,
        index: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        index: true,
    },
    // Payment Amounts
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: "usd",
        enum: ["usd"],
    },
    refundedAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Payment Method
    paymentMethod: {
        type: String,
        enum: ["payment_link", "saved_card", "card"],
        required: true,
    },
    // Stripe IDs
    stripePaymentIntentId: {
        type: String,
        index: true,
    },
    stripeChargeId: {
        type: String,
        index: true,
    },
    stripeCustomerId: {
        type: String,
        index: true,
    },
    stripePaymentMethodId: {
        type: String,
    },
    stripePaymentLinkId: {
        type: String,
    },
    // Payment Status
    status: {
        type: String,
        enum: [
            "pending",
            "succeeded",
            "failed",
            "cancelled",
            "refunded",
            "partially_refunded",
        ],
        default: "pending",
        index: true,
    },
    // Metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    // Error tracking
    errorMessage: {
        type: String,
    },
    // Card details (last 4 digits for display)
    cardLast4: {
        type: String,
    },
    cardBrand: {
        type: String,
    },
});
// Indexes
// salesOrder, customer, createdAt, stripePaymentIntentId, stripeChargeId, stripeCustomerId, status: index: true already creates indexes
// Only compound indexes need to be explicitly defined
PaymentsSchema.index({ salesOrder: 1, createdAt: -1 });
PaymentsSchema.index({ customer: 1, createdAt: -1 });
PaymentsSchema.index({ status: 1, createdAt: -1 });
// Update updatedAt before save
PaymentsSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});
export default mongoose.models.Payments ||
    mongoose.model("Payments", PaymentsSchema);
//# sourceMappingURL=Payments.js.map