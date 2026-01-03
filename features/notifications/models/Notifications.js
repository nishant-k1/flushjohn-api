import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["new_lead", "order_created", "quote_created", "job_order_created"],
      default: "new_lead",
    },
    title: {
      type: String,
      required: true,
      default: "New Lead Created",
    },
    message: {
      type: String,
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
// leadId: index: true already creates an index automatically
notificationSchema.index({ createdAt: -1 }); // For cleanup jobs

// Virtual for lead data (can be populated)
notificationSchema.virtual("lead", {
  ref: "Lead",
  localField: "leadId",
  foreignField: "_id",
  justOne: true,
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
