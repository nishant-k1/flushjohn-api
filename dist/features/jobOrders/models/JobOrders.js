import mongoose from "mongoose";
const JobOrdersSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    jobOrderNo: {
        type: Number,
    },
    // ✅ MongoDB References (ObjectId) - New proper relationships
    salesOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesOrders",
        index: true,
    },
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
    vendor: {
        name: {
            type: String,
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
        },
    },
    // Display numbers (NOT legacy - actively used in PDFs/emails)
    salesOrderNo: {
        type: Number,
    },
    customerNo: {
        type: Number,
    },
    // Job order specific fields
    emailStatus: {
        type: String,
        default: "Pending",
    },
    vendorAcceptanceStatus: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Accepted", "Denied"],
    },
    vendorHistory: {
        type: Array,
        default: [],
    },
    // ⚠️ REMOVED: Contact fields - Use lead reference instead
    // fName, lName, cName, email, phone, fax, address fields, usageType
    // Access via: jobOrder.lead.fName, jobOrder.lead.email, etc.
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
    billingCycles: [
        {
            cycleStartDate: {
                type: String,
            },
            cycleEndDate: {
                type: String,
            },
            nextBillingCycleDate: {
                type: String,
            },
            nextBillingCycleEndDate: {
                type: String,
            },
            isExtended: {
                type: Boolean,
                default: false,
            },
            extendedOn: {
                type: Date,
            },
            units: [
                {
                    productId: {
                        type: String,
                        required: true,
                    },
                    productName: {
                        type: String,
                        required: true,
                    },
                    unitId: {
                        type: String,
                        required: true,
                    },
                    quantity: {
                        type: Number,
                        required: true,
                    },
                    rate: {
                        type: Number,
                        required: true,
                    },
                    status: {
                        type: String,
                        enum: ["active", "returned", "extended"],
                        default: "active",
                    },
                    returnedOn: {
                        type: Date,
                    },
                    returnedQuantity: {
                        type: Number,
                        default: 0,
                    },
                },
            ],
        },
    ],
});
// Add indexes for faster queries
JobOrdersSchema.index({ createdAt: -1 }); // Sort by date
// salesOrder, lead, customer: index: true already creates indexes automatically
JobOrdersSchema.index({ emailStatus: 1 }); // Filter by email status
JobOrdersSchema.index({ vendorAcceptanceStatus: 1 }); // Filter by vendor status
JobOrdersSchema.index({ jobOrderNo: 1 }); // Find by job order number
export default mongoose.models.JobOrders ||
    mongoose.model("JobOrders", JobOrdersSchema);
//# sourceMappingURL=JobOrders.js.map