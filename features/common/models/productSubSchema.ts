import mongoose from "mongoose";

export const productSubSchema = new mongoose.Schema({
  id: { type: String },
  item: { type: String, trim: true },
  desc: { type: String, trim: true },
  quantity: { type: Number, default: 0, min: 0 },
  rate: { type: Number, default: 0, min: 0 },
  amount: { type: Number, default: 0, min: 0 },
  usageType: { type: String, trim: true },
}, { _id: false });
