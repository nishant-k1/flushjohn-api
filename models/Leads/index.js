const mongoose = require("mongoose");

const LeadsSchema = new mongoose.Schema({
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },
  leadNo: {
    type: Number,
    default: 999,
  },

  // Personal Details
  fullName: {
    type: String,
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

  // Address Details
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

  // Onsite Details
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

  // Official Details
  leadSource: {
    type: String,
  },
  status: {
    type: String,
    default: "None",
  },
  assignedTo: {
    type: String,
  },
});

module.exports = mongoose.models.Leads || mongoose.model("Leads", LeadsSchema);
