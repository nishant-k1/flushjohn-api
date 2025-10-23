import mongoose from "mongoose";

const QuotesSchema = new mongoose.Schema({
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
  leadNo: {
    type: String,
  },
  leadId: {
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
});

export default mongoose.models.Quotes || mongoose.model("Quotes", QuotesSchema);
