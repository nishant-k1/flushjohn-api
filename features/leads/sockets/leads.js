import Leads from "../models/Leads/index.js";
import alertService from "../../../services/alertService.js";

const productsData = (leadSource, products) => {
  // Normalize all product data to consistent CRM format - all strings for forms
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    // Handle old web form format: {type, quantity}
    if (product.type && product.quantity !== undefined) {
      const qty = Number(product.quantity) || 1;
      const rate = Number(product.rate) || 0;
      const amount = rate * qty;

      return {
        id: product.id || `legacy-${Date.now()}-${index}`,
        item: String(product.type || ""),
        desc: String(product.type || ""),
        qty: qty.toString(), // Convert to string for form consistency
        rate: rate.toFixed(2), // Convert to string with 2 decimals
        amount: amount.toFixed(2), // Convert to string with 2 decimals
      };
    }
    // Handle new CRM format: {item, qty, rate, amount} - ensure all strings
    else {
      const qty = product.qty || "1";
      const rate = product.rate || "0.00";
      const amount = product.amount || "0.00";

      return {
        id: product.id || `product-${Date.now()}-${index}`,
        item: String(product.item || ""),
        desc: String(product.desc || product.item || ""),
        qty: String(qty), // Ensure string
        rate: String(rate), // Ensure string
        amount: String(amount), // Ensure string
      };
    }
  });

  // Filter out products with no quantity for multi-step quote form
  if (leadSource === "Web Lead") {
    return normalizedProducts.filter((product) => {
      const qty = parseInt(product.qty || "0", 10) || 0;
      return qty > 0;
    });
  }

  return normalizedProducts;
};

const transformedLeadData = async ({
  leadSource,
  products,
  street,
  ...restArgs
}) => ({
  leadSource,
  products: productsData(leadSource, products),
  streetAddress: street || restArgs.streetAddress || "", // Map 'street' to 'streetAddress'
  ...restArgs,
});

export function leadSocketHandler(leadsNamespace, socket) {
  // Create Lead
  socket.on("createLead", async (leadData) => {
    try {
      const createdAt = new Date();
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
      const lead = await Leads.create(webLead);

      //  Send alerts after successful lead creation
      try {
        const alertResults = await alertService.sendLeadAlerts(lead);
        console.log(`📢 Alert sent for lead #${leadNo}`);
      } catch (alertError) {
        console.error(`⚠️ Alert failed for lead #${leadNo}:`, alertError);
      }

      const leadsList = await Leads.find().sort({ _id: -1 });
      leadsNamespace.emit("leadCreated", leadsList);
    } catch (error) {
      console.error("❌ Create Lead Error:", error);
    }
  });

  // Get All Leads
  socket.on("getLeads", async () => {
    try {
      const leadsList = await Leads.find().sort({ _id: -1 });
      socket.emit("leadList", leadsList);
    } catch (error) {
      console.error("❌ Get Leads Error:", error);
    }
  });

  // Get Single Lead
  socket.on("getLead", async (leadId) => {
    try {
      const lead = await Leads.findById(leadId);
      socket.emit("leadData", lead);
    } catch (error) {
      console.error("❌ Get Lead Error:", error);
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
      console.error("❌ Update Lead Error:", error);
    }
  });

  // Delete Lead
  socket.on("deleteLead", async (leadId) => {
    try {
      await Leads.findByIdAndDelete(leadId);
      const leadsList = await Leads.find().sort({ _id: -1 });
      socket.emit("leadDeleted", leadsList);
    } catch (error) {
      console.error("❌ Delete Lead Error:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Lead Socket Disconnected:", socket.id);
  });
}
