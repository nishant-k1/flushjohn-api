import Leads from "../models/Leads/index.js";
import alertService from "../../common/services/alertService.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

const productsData = (leadSource, products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
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

export function leadSocketHandler(leadsNamespace, socket) {
  socket.on("createLead", async (leadData) => {
    try {
      console.log("📥 Received createLead socket event");
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
      const lead = await Leads.create(webLead);
      try {
        const alertResults = await alertService.sendLeadAlerts(lead);
      } catch (alertError) {
      }

      const leadsList = await Leads.find().sort({ _id: -1 });
      leadsNamespace.emit("leadCreated", leadsList);
      console.log("📢 Emitted leadCreated socket event for new lead");
    } catch (error) {
      console.error("❌ Error creating lead via socket:", error);
    }
  });

  socket.on("getLeads", async () => {
    try {
      const leadsList = await Leads.find().sort({ _id: -1 });
      socket.emit("leadList", leadsList);
    } catch (error) {
    }
  });

  socket.on("getLead", async (leadId) => {
    try {
      const lead = await Leads.findById(leadId);
      socket.emit("leadData", lead);
    } catch (error) {
    }
  });

  socket.on("updateLead", async ({ _id, data }) => {
    try {
      const lead = await Leads.findByIdAndUpdate(_id, data, {
        new: true,
      });
      socket.emit("leadUpdated", lead);
    } catch (error) {
    }
  });

  socket.on("deleteLead", async (leadId) => {
    try {
      await Leads.findByIdAndDelete(leadId);
      const leadsList = await Leads.find().sort({ _id: -1 });
      socket.emit("leadDeleted", leadsList);
    } catch (error) {
    }
  });

  socket.on("disconnect", () => {
  });
}
