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
    ref: "SalesOrder",
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

  // 🔄 Legacy fields (kept for backward compatibility during migration)
  salesOrderNo: {
    type: Number,
  },
  customerNo: {
    type: Number,
  },

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
  // ⚠️ REMOVED: fName, lName, cName - Use customer reference instead
  // fName: {
  //   type: String,
  // },
  // lName: {
  //   type: String,
  // },
  // cName: {
  //   type: String,
  // },
  // ⚠️ REMOVED: email, phone, fax - Use customer reference instead
  // email: {
  //   type: String,
  // },
  // phone: {
  //   type: String,
  // },
  // fax: {
  //   type: String,
  // },

  // ⚠️ REMOVED: streetAddress, city, state, zip, country - Use customer reference instead
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

  // ⚠️ REMOVED: usageType - Use salesOrder/lead reference instead
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
JobOrdersSchema.index({ email: 1 }); // Find by email
JobOrdersSchema.index({ salesOrder: 1 }); // Find by sales order reference
JobOrdersSchema.index({ lead: 1 }); // Find by lead reference
JobOrdersSchema.index({ customer: 1 }); // Find by customer reference
JobOrdersSchema.index({ emailStatus: 1 }); // Filter by email status
JobOrdersSchema.index({ vendorAcceptanceStatus: 1 }); // Filter by vendor status
JobOrdersSchema.index({ jobOrderNo: 1 }); // Find by job order number

export default mongoose.models.JobOrders ||
  mongoose.model("JobOrders", JobOrdersSchema);
