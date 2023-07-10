const mongoose = require("mongoose");

const VendorsSchema = new mongoose.Schema({
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },

  vendorNo: {
    type: Number,
  },

  // Company Details
  name: {
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

  // service details
  repNames: {
    type: String,
  },
  serviceCities: {
    type: String,
  },
  serviceStates: {
    type: String,
  },
  serviceZipCodes: {
    type: String,
  },
  note: {
    type: String,
  },
});

module.exports =
  mongoose.models.Vendors || mongoose.model("Vendors", VendorsSchema);
