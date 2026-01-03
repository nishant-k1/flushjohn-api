import mongoose from "mongoose";

const SalesOrdersSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  salesOrderNo: {
    type: Number,
    unique: true,
    required: true,
  },

  // ✅ MongoDB References (ObjectId) - New proper relationships
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quotes",
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

  // Display numbers (NOT legacy - actively used in PDFs/emails)
  customerNo: {
    type: Number,
  },
  leadNo: {
    type: String,
  },

  // Sales order specific fields
  status: {
    type: String,
    enum: ["active", "cancelled"],
    default: "active",
    index: true,
  },
  emailStatus: {
    type: String,
    default: "Pending",
  },
  // ⚠️ REMOVED: Contact fields - Use lead reference instead
  // fName, lName, cName, email, phone, fax, address fields, usageType
  // Access via: salesOrder.lead.fName, salesOrder.lead.email, etc.
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

  // Payment fields
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Partially Paid", "Paid", "Refunded"],
    default: "Unpaid",
    index: true,
  },
  orderTotal: {
    type: Number,
    default: 0,
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  balanceDue: {
    type: Number,
    default: 0,
    min: 0,
  },
  dueDate: {
    type: Date,
  },
  stripeCustomerId: {
    type: String,
    index: true,
  },
});

// Add indexes for faster queries
SalesOrdersSchema.index({ createdAt: -1 }); // Sort by date
// quote, lead, customer, status, paymentStatus, stripeCustomerId: index: true already creates indexes automatically
SalesOrdersSchema.index({ emailStatus: 1 }); // Filter by email status
SalesOrdersSchema.index({ customerNo: 1 }); // Legacy customer number

export default mongoose.models.SalesOrders ||
  mongoose.model("SalesOrders", SalesOrdersSchema);
