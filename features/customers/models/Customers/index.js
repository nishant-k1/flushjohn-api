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
  
  // Primary SalesOrder reference (for quick access to main sales order)
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesOrder",
    index: true,
  },
  
  // Arrays for multiple related records
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

  // ⚠️ REMOVED Legacy arrays - Use reference arrays instead
  // salesOrderNo: [Number] - Use salesOrders reference array
  // quoteNo: [Number] - Use quotes reference array

  // Customer contact information (single source of truth - NOT legacy)
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
