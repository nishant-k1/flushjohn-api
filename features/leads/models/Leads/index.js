import { Schema, model } from "mongoose";

const LeadsSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  leadNo: {
    type: Number,
  },
  leadSource: {
    type: String,
  },
  leadStatus: {
    type: String,
    default: "None",
  },
  assignedTo: {
    type: String,
  },

  usageType: {
    type: String,
  },
  products: {
    type: Array,
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
  contactPersonName: {
    type: String,
  },
  contactPersonPhone: {
    type: String,
  },

  deliveryDate: {
    type: String,
  },
  pickupDate: {
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
  instructions: {
    type: String,
  },
});

LeadsSchema.index({ createdAt: -1 }); // For sorting by creation date
LeadsSchema.index({ leadNo: 1 }); // For lead number lookups
LeadsSchema.index({ leadStatus: 1 }); // For filtering by status
LeadsSchema.index({ assignedTo: 1 }); // For filtering by assigned user
LeadsSchema.index({ leadSource: 1 }); // For filtering by source
LeadsSchema.index({ createdAt: -1, leadStatus: 1 }); // Compound index for common queries
LeadsSchema.index({ assignedTo: 1, leadStatus: 1 }); // Compound index for user-specific queries

export default model("Leads", LeadsSchema);
