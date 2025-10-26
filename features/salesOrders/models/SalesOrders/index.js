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
    ref: "Quote",
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

  // 🔄 Legacy fields (kept for backward compatibility during migration)
  customerNo: {
    type: Number,
  },
  leadNo: {
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
SalesOrdersSchema.index({ createdAt: -1 }); // Sort by date
SalesOrdersSchema.index({ email: 1 }); // Find by email
SalesOrdersSchema.index({ customer: 1 }); // Find by customer reference
SalesOrdersSchema.index({ lead: 1 }); // Find by lead reference
SalesOrdersSchema.index({ quote: 1 }); // Find by quote reference
SalesOrdersSchema.index({ emailStatus: 1 }); // Filter by status
SalesOrdersSchema.index({ customerNo: 1 }); // Legacy customer number

export default mongoose.models.SalesOrders ||
  mongoose.model("SalesOrders", SalesOrdersSchema);
