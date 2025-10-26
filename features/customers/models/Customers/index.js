import mongoose from "mongoose";

const CustomersSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  customerNo: {
    type: Number,
    unique: true,
  },

  // ✅ MongoDB References (ObjectId) - Relationships to related records
  // Note: Leads are not stored here since Lead -> Customer is one-way
  quotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
    },
  ],
  salesOrders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
    },
  ],
  jobOrders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOrder",
    },
  ],

  // 🔄 Legacy fields (kept for backward compatibility)
  // ⚠️ REMOVED: salesOrderNo array - Use salesOrders reference array instead
  // salesOrderNo: {
  //   type: [Number],
  // },
  // ⚠️ REMOVED: quoteNo array - Use quotes reference array instead
  // quoteNo: {
  //   type: [Number],
  // },

  // Customer contact information (single source of truth)
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

  // ⚠️ REMOVED: These should be on sales order level, not customer level
  // deliveryDate: {
  //   type: String,
  // },
  // pickupDate: {
  //   type: String,
  // },
  // contactPersonName: {
  //   type: String,
  // },
  // contactPersonPhone: {
  //   type: String,
  // },
  // products: {
  //   type: Array,
  // },
  // instructions: {
  //   type: String,
  // },

  note: {
    type: String,
  },
});

export default mongoose.models.Customers ||
  mongoose.model("Customers", CustomersSchema);
