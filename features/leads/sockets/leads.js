import Leads from "../models/Leads/index.js";
import alertService from "../../../services/alertService.js";

const productsData = (leadSource, products) => {
  // Since all forms now use consistent CRM format, just return products as-is
  // Only filter out products with quantity 0 for web leads
  if (!Array.isArray(products)) {
    return [];
  }

  if (leadSource === "Web Lead") {
    // Filter out products with no quantity for multi-step quote form
    return products.filter((product) => {
      const qty = parseInt(product.qty) || 0;
      return qty > 0;
    });
  }

  // For all other lead sources, return products as-is (they're already in CRM format)
  return products;
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
