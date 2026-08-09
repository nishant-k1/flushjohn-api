import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  userEmail: { type: String },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, index: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  requestId: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
