import * as notificationsService from "./notificationsService.js";
import User from "../../auth/models/User.js";

/**
 * Create notification for a new lead
 * Creates notifications for all active users
 */
export const createLeadNotification = async (lead) => {
  try {
    if (!lead || !lead._id) {
      console.warn("⚠️ Invalid lead data for notification creation");
      return [];
    }

    // Get all active users
    const users = await (User as any)
      .find({ isActive: true })
      .select("_id")
      .lean();

    if (!users || users.length === 0) {
      return [];
    }

    // Build notification message
    const fullName = `${lead.firstName || lead.fName || ""} ${
      lead.lastName || lead.lName || ""
    }`.trim();

    // Use database data only - no fallbacks
    let notificationMessage;
    if (lead.companyName && lead.companyName.trim() !== "") {
      notificationMessage = `${fullName} - ${lead.companyName}`;
    } else {
      const usageType = lead.usageType || "";
      notificationMessage = usageType
        ? `${fullName} - ${usageType}`
        : fullName || "New Lead";
    }

    // Create notifications for all active users and wait for them to be saved
    const notificationPromises = users.map((user) =>
      notificationsService.createOrUpdateNotification(user._id, lead._id, {
        type: "new_lead",
        title: "New Lead Created",
        message: notificationMessage,
        metadata: {
          leadNo: lead.leadNo,
          firstName: lead.firstName || lead.fName,
          lastName: lead.lastName || lead.lName,
          fName: lead.fName,
          lName: lead.lName,
          companyName: lead.companyName || lead.cName,
          usageType: lead.usageType,
          email: lead.email,
          phone: lead.phone,
        },
      })
    );

    const savedNotifications = await Promise.all(notificationPromises);
    return savedNotifications;
  } catch (error) {
    console.error("❌ Error creating lead notifications:", error);
    return [];
  }
};
