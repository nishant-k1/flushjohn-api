import { Schema, model } from "mongoose";

const LeadsSchema = new Schema({
  leadNo: {
    type: Number,
    unique: true,
  },
  leadSource: {
    type: String,
    trim: true,
  },
  leadStatus: {
    type: String,
    default: "None",
    trim: true,
  },
  assignedTo: {
    type: String,
    trim: true,
  },

  // ✅ MongoDB References (ObjectId) - Relationships to related records
  quotes: [
    {
      type: Schema.Types.ObjectId,
      ref: "Quotes",
    },
  ],
  salesOrders: [
    {
      type: Schema.Types.ObjectId,
      ref: "SalesOrders",
    },
  ],
  jobOrders: [
    {
      type: Schema.Types.ObjectId,
      ref: "JobOrders",
    },
  ],
  // Optional: reference to customer if lead converted
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },

  usageType: {
    type: String,
    trim: true,
  },
  products: {
    type: Array,
  },

  // Contact Information - with normalization
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
  contactPersonName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  contactPersonPhone: {
    type: String,
    trim: true,
  },

  // Dates - Changed from String to Date for proper Mongoose handling
  deliveryDate: {
    type: Date,
  },
  pickupDate: {
    type: Date,
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
  instructions: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true, // Auto-manage createdAt and updatedAt
});

// Indexes for query performance
LeadsSchema.index({ createdAt: -1 }); // For sorting by creation date
// leadNo: unique: true already creates an index automatically
LeadsSchema.index({ leadStatus: 1 }); // For filtering by status
LeadsSchema.index({ assignedTo: 1 }); // For filtering by assigned user
LeadsSchema.index({ leadSource: 1 }); // For filtering by source
LeadsSchema.index({ email: 1 }); // For email lookup
LeadsSchema.index({ phone: 1 }); // For phone lookup
LeadsSchema.index({ createdAt: -1, leadStatus: 1 }); // Compound index for common queries
LeadsSchema.index({ assignedTo: 1, leadStatus: 1 }); // Compound index for user-specific queries

export default model("Lead", LeadsSchema);
