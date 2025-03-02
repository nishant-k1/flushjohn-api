import Leads from "../models/Leads/index.js";

const productsData = (leadSource, products) => {
  if (!Array.isArray(products)) {
    return;
  }
  let transformedProductsData = [];
  if (leadSource === "Web Quick Lead") {
    transformedProductsData = products.map((item) => ({
      item: item.name || "",
      desc: item.desc || "",
      qty: item.qty || "",
      rate: item.rate || "",
      amount: item.amount || "",
    }));
  } else if (leadSource === "Web Lead") {
    transformedProductsData = products.map((item) => ({
      item: item.name || "",
      desc: item.desc || "",
      qty: item.qty || "",
      rate: item.rate || "",
      amount: item.amount || "",
    }));
  } else if (leadSource === "Call Lead") {
    transformedProductsData = products.map(
      ({ id, item, desc, qty, rate, amount }) => ({
        id,
        item,
        desc,
        qty,
        rate,
        amount,
      })
    );
  }
  return transformedProductsData;
};

const transformedLeadData = async ({ leadSource, products, ...restArgs }) => ({
  leadSource,
  products: productsData(leadSource, products),
  ...restArgs,
});

export function leadSocketHandler(leadsNamespace, socket) {
  // // Create Lead
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
      await Leads.create(webLead);
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

  // // Get Single Lead
  socket.on("getLead", async (leadId) => {
    try {
      const lead = await Leads.findById(leadId);
      socket.emit("leadData", lead);
    } catch (error) {
      console.error("❌ Get Lead Error:", error);
    }
  });

  // // Update Lead
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

  // // Delete Lead
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
