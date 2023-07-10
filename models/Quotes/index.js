const mongoose = require("mongoose");

const QuotesSchema = new mongoose.Schema({
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },
  quoteNo: {
    type: Number,
  },
  customerNo: {
    type: Number,
  },
  emailStatus: {
    type: String,
    default: "Pending",
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

  // Official Details
  note: {
    type: String,
  },
});

module.exports =
  mongoose.models.Quotes || mongoose.model("Quotes", QuotesSchema);
