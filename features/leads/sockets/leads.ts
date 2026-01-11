import Leads from "../models/Leads.js";
import alertService from "../../common/services/alertService.js";
import { getCurrentDateTime } from "../../../lib/dayjs.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";

const productsData = (leadSource, products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    // Always use quantity field (standardized)
    const quantity = Number(product.quantity) || 0;
    const rate = Number(product.rate) || 0;
    // Use utility function for consistent calculation
    const amount =
      Number(product.amount) ||
      parseFloat(calculateProductAmount(quantity, rate));

    return {
      id: product.id || `product-${Date.now()}-${index}`,
      item: String(product.item || product.type || ""),
      desc: String(product.desc || product.item || product.type || ""),
      quantity: quantity,
      rate: rate,
      amount: amount,
    };
  });

  if (leadSource === "Web Lead" || leadSource === "Web Quick Lead") {
    return normalizedProducts.filter((product) => product.quantity > 0);
  }

  return normalizedProducts;
};

const transformedLeadData = async (leadData) => {
  const {
    leadSource,
    products,
    street,
    streetAddress,
    usageType,
    ...restArgs
  } = leadData;

  const actualLeadSource = leadSource || "Web Lead";

  let processedUsageType = usageType || "";
  if (usageType) {
    processedUsageType =
      usageType.charAt(0).toUpperCase() + usageType.slice(1).toLowerCase();
  }

  return {
    ...restArgs,
    leadSource: actualLeadSource,
    usageType: processedUsageType,
    products: productsData(actualLeadSource, products),
    streetAddress: street || streetAddress || "", // Map 'street' to 'streetAddress'
  };
};

// CRITICAL FIX: Rate limiting for socket events
const socketEventCounts = new Map<string, { count: number; resetAt: number }>();
const SOCKET_RATE_LIMIT = 30; // Max 30 events per window
const SOCKET_RATE_WINDOW = 60 * 1000; // 1 minute window

const checkSocketRateLimit = (socketId: string, eventName: string): boolean => {
  const key = `${socketId}:${eventName}`;
  const now = Date.now();
  const record = socketEventCounts.get(key);

  if (!record || record.resetAt < now) {
    socketEventCounts.set(key, { count: 1, resetAt: now + SOCKET_RATE_WINDOW });
    return true;
  }

  if (record.count >= SOCKET_RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
};

// Cleanup old rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of socketEventCounts.entries()) {
    if (record.resetAt < now) {
      socketEventCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export function leadSocketHandler(leadsNamespace, socket) {
  socket.on("createLead", async (leadData) => {
    try {
      // CRITICAL FIX: Rate limiting for socket events
      if (!checkSocketRateLimit(socket.id, "createLead")) {
        socket.emit("error", {
          message: "Too many requests. Please wait before trying again.",
          error: "RATE_LIMIT_EXCEEDED",
          event: "createLead",
        });
        return;
      }

      console.log("📥 Received createLead socket event");
      const createdAt = getCurrentDateTime();
      
      // CRITICAL FIX: Use atomic lead number generation to prevent race conditions
      const { generateLeadNumber } = await import("../services/leadsService.js");
      const leadNo = await generateLeadNumber();

      const webLead = await transformedLeadData({
        ...leadData,
        createdAt,
        leadNo,
      });
      const lead = await Leads.create(webLead);

      // Send alerts in background (non-blocking)
      alertService.sendLeadAlerts(lead).catch((alertError: any) => {
        console.error("❌ Error sending lead alerts:", alertError);
      });

      // Create notifications and get saved data - MUST await before emitting events
      const { createLeadNotification } = await import("../../notifications/services/notificationHelpers.js");
      const savedNotifications = await createLeadNotification(lead);
      console.log(`✅ Created ${savedNotifications.length} notifications for lead ${lead._id}`);

      // Emit lead created event ONLY after notifications are saved
      const leadPayload = { lead: lead.toObject(), action: "add" };
      leadsNamespace.emit("leadCreated", leadPayload);
      socket.emit("leadCreated", leadPayload);
      console.log(`📢 Emitted leadCreated event for lead ${lead._id}`);

      // Emit notification events with saved notification data
      if (savedNotifications.length > 0) {
        savedNotifications.forEach((notification: any) => {
          const notifPayload = {
            notification: notification.toObject ? notification.toObject() : notification,
            action: "add",
          };
          leadsNamespace.emit("notificationCreated", notifPayload);
          socket.emit("notificationCreated", notifPayload);
        });
        console.log(`📢 Emitted ${savedNotifications.length} notificationCreated events`);
      }
    } catch (error) {
      console.error("❌ Error creating lead via socket:", error);
      socket.emit("leadCreationError", {
        message: error.message || "Failed to create lead",
        error: error.name || "LEAD_CREATION_ERROR",
      });
    }
  });

  /**
   * Get all leads (with limit to prevent fetching entire collection)
   * Validates request and handles errors properly
   */
  socket.on("getLeads", async () => {
    try {
      // CRITICAL FIX: Rate limiting for socket events
      if (!checkSocketRateLimit(socket.id, "getLeads")) {
        socket.emit("error", {
          message: "Too many requests. Please wait before trying again.",
          error: "RATE_LIMIT_EXCEEDED",
          event: "getLeads",
        });
        return;
      }
      // OPTIMIZATION: Add limit to prevent fetching entire collection
      const leadsList = await Leads.find().sort({ _id: -1 }).limit(100).lean();
      socket.emit("leadList", leadsList);
    } catch (error: any) {
      console.error("❌ Error fetching leads via socket:", error);
      socket.emit("error", {
        message: error.message || "Failed to fetch leads",
        error: error.name || "LEAD_FETCH_ERROR",
        event: "getLeads",
      });
    }
  });

  /**
   * Get single lead by ID
   * Validates leadId and handles errors properly
   */
  socket.on("getLead", async (leadId) => {
    try {
      // CRITICAL FIX: Rate limiting for socket events
      if (!checkSocketRateLimit(socket.id, "getLead")) {
        socket.emit("error", {
          message: "Too many requests. Please wait before trying again.",
          error: "RATE_LIMIT_EXCEEDED",
          event: "getLead",
        });
        return;
      }
      // Validate leadId format (MongoDB ObjectId)
      if (!leadId || typeof leadId !== "string" || !/^[0-9a-fA-F]{24}$/.test(leadId)) {
        socket.emit("error", {
          message: "Invalid lead ID format",
          error: "INVALID_ID_FORMAT",
          event: "getLead",
        });
        return;
      }

      const lead = await Leads.findById(leadId);
      if (!lead) {
        socket.emit("error", {
          message: "Lead not found",
          error: "LEAD_NOT_FOUND",
          event: "getLead",
        });
        return;
      }
      socket.emit("leadData", lead);
    } catch (error: any) {
      console.error("❌ Error fetching lead via socket:", error);
      socket.emit("error", {
        message: error.message || "Failed to fetch lead",
        error: error.name || "LEAD_FETCH_ERROR",
        event: "getLead",
      });
    }
  });

  /**
   * Update lead
   * Validates input and handles errors properly
   */
  socket.on("updateLead", async ({ _id, data }) => {
    try {
      // CRITICAL FIX: Rate limiting for socket events
      if (!checkSocketRateLimit(socket.id, "updateLead")) {
        socket.emit("error", {
          message: "Too many requests. Please wait before trying again.",
          error: "RATE_LIMIT_EXCEEDED",
          event: "updateLead",
        });
        return;
      }
      // Validate input structure
      if (!_id || typeof _id !== "string") {
        socket.emit("error", {
          message: "Lead ID is required",
          error: "INVALID_INPUT",
          event: "updateLead",
        });
        return;
      }

      // Validate leadId format (MongoDB ObjectId)
      if (!/^[0-9a-fA-F]{24}$/.test(_id)) {
        socket.emit("error", {
          message: "Invalid lead ID format",
          error: "INVALID_ID_FORMAT",
          event: "updateLead",
        });
        return;
      }

      if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
        socket.emit("error", {
          message: "Update data is required",
          error: "INVALID_INPUT",
          event: "updateLead",
        });
        return;
      }

      const lead = await Leads.findByIdAndUpdate(_id, data, {
        new: true,
      });

      if (!lead) {
        socket.emit("error", {
          message: "Lead not found",
          error: "LEAD_NOT_FOUND",
          event: "updateLead",
        });
        return;
      }

      socket.emit("leadUpdated", lead);
    } catch (error: any) {
      console.error("❌ Error updating lead via socket:", error);
      socket.emit("error", {
        message: error.message || "Failed to update lead",
        error: error.name || "LEAD_UPDATE_ERROR",
        event: "updateLead",
      });
    }
  });

  /**
   * Delete lead
   * Validates leadId and handles errors properly
   */
  socket.on("deleteLead", async (leadId) => {
    try {
      // CRITICAL FIX: Rate limiting for socket events
      if (!checkSocketRateLimit(socket.id, "deleteLead")) {
        socket.emit("error", {
          message: "Too many requests. Please wait before trying again.",
          error: "RATE_LIMIT_EXCEEDED",
          event: "deleteLead",
        });
        return;
      }
      // Validate leadId format (MongoDB ObjectId)
      if (!leadId || typeof leadId !== "string" || !/^[0-9a-fA-F]{24}$/.test(leadId)) {
        socket.emit("error", {
          message: "Invalid lead ID format",
          error: "INVALID_ID_FORMAT",
          event: "deleteLead",
        });
        return;
      }

      const deletedLead = await Leads.findByIdAndDelete(leadId);
      if (!deletedLead) {
        socket.emit("error", {
          message: "Lead not found",
          error: "LEAD_NOT_FOUND",
          event: "deleteLead",
        });
        return;
      }

      // OPTIMIZATION: Emit deleted lead ID instead of fetching all leads
      socket.emit("leadDeleted", { leadId, action: "delete" });
    } catch (error: any) {
      console.error("❌ Error deleting lead via socket:", error);
      socket.emit("error", {
        message: error.message || "Failed to delete lead",
        error: error.name || "LEAD_DELETE_ERROR",
        event: "deleteLead",
      });
    }
  });

  socket.on("disconnect", () => {});
}
