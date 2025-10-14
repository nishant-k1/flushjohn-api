import Leads from "../models/Leads/index.js";
import alertService from "../../../services/alertService.js";

const productsData = (leadSource, products) => {
  // Normalize all product data to proper types for database storage
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    // Handle old web form format: {type, quantity}
    if (product.type && product.quantity !== undefined) {
      const qty = Number(product.quantity);
      const rate = Number(product.rate) || 0;
      const amount = rate * qty;

      return {
        id: product.id || `legacy-${Date.now()}-${index}`,
        item: String(product.type || ""),
        desc: String(product.type || ""),
        qty: qty, // Keep as number for database
        rate: rate, // Keep as number for database
        amount: amount, // Keep as number for database
      };
    }
    // Handle new application state format: {item, qty, rate, amount} - ensure proper types
    else {
      const qty = Number(product.qty);
      const rate = Number(product.rate) || 0;
      const amount = Number(product.amount) || 0;

      return {
        id: product.id || `product-${Date.now()}-${index}`,
        item: String(product.item || ""),
        desc: String(product.desc || product.item || ""),
        qty: qty, // Number for database
        rate: rate, // Number for database
        amount: amount, // Number for database
      };
    }
  });

  // Filter out products with no quantity for multi-step quote form
  if (leadSource === "Web Lead") {
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
  
  return {
    ...restArgs,
    leadSource: leadSource || "Web Lead",
    usageType: usageType ? usageType.charAt(0).toUpperCase() + usageType.slice(1) : "",
    products: productsData(leadSource || "Web Lead", products),
    streetAddress: street || streetAddress || "", // Map 'street' to 'streetAddress'
  };
};

export function leadSocketHandler(leadsNamespace, socket) {
  // Create Lead
  socket.on("createLead", async (leadData) => {
    try {
      console.log("📥 Received lead data:", JSON.stringify(leadData, null, 2));
      console.log("🔍 Key fields check:", {
        usageType: leadData.usageType,
        leadSource: leadData.leadSource,
        fName: leadData.fName,
        lName: leadData.lName,
        cName: leadData.cName,
        productsCount: leadData.products?.length || 0
      });
      
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
      
      console.log("🔄 Transformed lead data:", JSON.stringify(webLead, null, 2));
      console.log("💾 About to save to database:", {
        usageType: webLead.usageType,
        leadSource: webLead.leadSource,
        fName: webLead.fName,
        lName: webLead.lName,
        cName: webLead.cName,
        productsCount: webLead.products?.length || 0,
        firstProduct: webLead.products?.[0]
      });
      
      const lead = await Leads.create(webLead);
      
      console.log("✅ Saved to database:", {
        _id: lead._id,
        usageType: lead.usageType,
        leadSource: lead.leadSource,
        fName: lead.fName,
        lName: lead.lName,
        cName: lead.cName,
        productsCount: lead.products?.length || 0,
        firstProduct: lead.products?.[0]
      });

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
