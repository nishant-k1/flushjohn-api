import mongoose from "mongoose";

const CustomersSchema = new mongoose.Schema({
  // Tracking
  createdAt: {
    type: Date,
    default: Date.now,
  },
  customerNo: {
    type: Number,
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
  products: {
    type: Array,
  },
  instructions: {
    type: String,
  },

  // Official Details
  note: {
    type: String,
  },
});

export default mongoose.models.Customers ||
  mongoose.model("Customers", CustomersSchema);
