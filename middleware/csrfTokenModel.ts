import mongoose from "mongoose";

const CsrfTokenSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: auto-delete after 24 hours
  },
});

export default mongoose.models.CsrfToken ||
  mongoose.model("CsrfToken", CsrfTokenSchema);
