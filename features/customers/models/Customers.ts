import mongoose from "mongoose";

const CustomersSchema = new mongoose.Schema(
  {
    customerNo: {
      type: Number,
      unique: true,
    },

    // ✅ MongoDB References (ObjectId) - Relationships to related records
    // Note: Leads are not stored here since Lead -> Customer is one-way

    // Primary SalesOrder reference (for quick access to main sales order)
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrders",
      index: true,
    },

    // Arrays for multiple related records
    quotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quotes",
      },
    ],
    salesOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesOrders",
      },
    ],
    jobOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobOrders",
      },
    ],

    // ⚠️ REMOVED Legacy arrays - Use reference arrays instead
    // salesOrderNo: [Number] - Use salesOrders reference array
    // quoteNo: [Number] - Use quotes reference array

    // Customer contact information - with normalization
    fName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    cName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    fax: {
      type: String,
      trim: true,
    },

    // Address Information
    streetAddress: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      uppercase: true,
      trim: true,
    },
    zip: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: "USA",
      trim: true,
    },

    // ⚠️ REMOVED: These should be on sales order level, not customer level
    // deliveryDate, pickupDate, contactPersonName, contactPersonPhone, products, instructions

    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Auto-manage createdAt and updatedAt
  }
);

// Indexes for query performance
CustomersSchema.index({ email: 1 }); // For email lookup
CustomersSchema.index({ phone: 1 }); // For phone lookup
CustomersSchema.index({ createdAt: -1 }); // For sorting by creation date

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomersSchema);
