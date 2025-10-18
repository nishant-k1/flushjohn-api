import Leads from "../models/Leads/index.js";
import alertService from "../../../services/alertService.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

const productsData = (leadSource, products) => {
  // Normalize all product data to proper types for database storage
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    // Handle old web form format: {type, quantity} - from Quick Quote and legacy data
    if (product.type && product.quantity !== undefined) {
      const qty = Number(product.quantity);
      const rate = Number(product.rate) || 0;
      const amount = Number(product.amount) || rate * qty;

      return {
        id: product.id || `legacy-${Date.now()}-${index}`,
        item: String(product.type || ""),
        desc: String(product.desc || product.type || ""),
        qty: qty,
        rate: rate,
        amount: amount,
      };
    }
    // Handle new application state format: {item, qty, rate, amount} - from Quote Form and CRM
    else {
      const qty = Number(product.qty);
      const rate = Number(product.rate) || 0;
      const amount = Number(product.amount) || rate * qty;

      return {
        id: product.id || `product-${Date.now()}-${index}`,
        item: String(product.item || ""),
        desc: String(product.desc || product.item || ""),
        qty: qty,
        rate: rate,
        amount: amount,
      };
    }
  });

  // Filter out products with no quantity for web forms only
  // CRM forms should preserve all products (including qty: 0) for editing
  if (leadSource === "Web Lead" || leadSource === "Web Quick Lead") {
    return normalizedProducts.filter((product) => product.qty > 0);
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

  // Determine the actual lead source with proper defaults
  const actualLeadSource = leadSource || "Web Lead";

  // Handle usage type capitalization for web forms and normalize existing data
  // CRM forms already have proper capitalization
  let processedUsageType = usageType || "";
  if (usageType) {
    // Normalize to proper capitalization for all forms
    // This handles both new web forms and existing leads with inconsistent casing
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

export function leadSocketHandler(leadsNamespace, socket) {
  // Create Lead
  socket.on("createLead", async (leadData) => {
    try {
      // Lead creation started

      const createdAt = getCurrentDateTime();
      const latestLead = await Leads.findOne({}, "leadNo").sort({
        leadNo: -1,
      });
      const latestLeadNo = latestLead ? latestLead.leadNo : 999;
      const newLeadNo = latestLeadNo + 1;
      const leadNo = newLeadNo;

      const webLead = await transformedLeadData({
        ...leadData,
        createdAt,
        leadNo,
      });

      // Lead data transformed successfully

      const lead = await Leads.create(webLead);

      // Lead created successfully

      //  Send alerts after successful lead creation
      try {
        const alertResults = await alertService.sendLeadAlerts(lead);
        // Alerts sent successfully
      } catch (alertError) {
        // Alert sending failed
      }

      const leadsList = await Leads.find().sort({ _id: -1 });
      leadsNamespace.emit("leadCreated", leadsList);
    } catch (error) {
      // Lead creation failed
    }
  });

  // Get All Leads
  socket.on("getLeads", async () => {
    try {
      const leadsList = await Leads.find().sort({ _id: -1 });
      socket.emit("leadList", leadsList);
    } catch (error) {
      // Error getting leads
    }
  });

  // Get Single Lead
  socket.on("getLead", async (leadId) => {
    try {
      const lead = await Leads.findById(leadId);
      socket.emit("leadData", lead);
    } catch (error) {
      // Error getting lead
    }
  });

  // Update Lead
  socket.on("updateLead", async ({ _id, data }) => {
    try {
      const lead = await Leads.findByIdAndUpdate(_id, data, {
        new: true,
      });
      socket.emit("leadUpdated", lead);
    } catch (error) {
      // Error updating lead
    }
  });

  // Delete Lead
  socket.on("deleteLead", async (leadId) => {
    try {
      await Leads.findByIdAndDelete(leadId);
      const leadsList = await Leads.find().sort({ _id: -1 });
      socket.emit("leadDeleted", leadsList);
    } catch (error) {
      // Error deleting lead
    }
  });

  socket.on("disconnect", () => {
    // Client disconnected
  });
}
