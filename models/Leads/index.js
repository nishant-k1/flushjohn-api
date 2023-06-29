const mongoose = require("mongoose");

const LeadsSchema = new mongoose.Schema({
  // Official Details
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

  // Requirement Details
  usageType: {
    type: String,
  },
  products: {
    type: Array,
  },

  // Personal Details
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

  // Delivery Details
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

module.exports = mongoose.models.Leads || mongoose.model("Leads", LeadsSchema);
