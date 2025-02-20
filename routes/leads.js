var express = require("express");
var router = express.Router();
const Leads = require("../models/Leads");

const productsData = (leadSource, products) => {
  let transformedProductsData = [];
  if (leadSource === "Web Quick Lead") {
    transformedProductsData = products.map((item) => ({
      item: item,
      desc: "",
      qty: "",
      rate: "",
      amount: "",
    }));
  } else if (leadSource === "Web Lead") {
    transformedProductsData = products.map((item) => ({
      item: item.name,
      desc: "",
      qty: item.qty,
      rate: "",
      amount: "",
    }));
  }
  return transformedProductsData;
};

const leadData = async ({ leadSource, products, ...restArgs }) => ({
  leadSource,
  products: await productsData(leadSource, products),
  ...restArgs,
});

router.post("/", async function (req, res, next) {
  try {
    const createdAt = new Date();
    const latestLead = await Leads.findOne({}, "leadNo").sort({
      leadNo: -1,
    });
    const latestLeadNo = latestLead ? latestLead.leadNo : 999;
    const newLeadNo = latestLeadNo + 1;
    const leadNo = newLeadNo;
    const weblead = leadData({ ...req.body, createdAt, leadNo });
    const lead = await Leads.create(weblead);
    res.io.emit("create-lead", lead);
    res.status(201).json({ success: true, data: lead.data });
  } catch (error) {
    console.log(error);
  }
});

// router.get("/", async function (req, res, next) {
//   try {
//     // await corsHandle(req, res)
//     const { searchParams } = new URL(req.url);
//     const _id = searchParams.get("_id");
//     if (_id) {
//       const leads = await Leads.findById(_id);
//       res.status(200).json({ success: true, data: leads });
//     } else {
//       const leadsList = await Leads.find().sort({ _id: -1 });
//       res.status(200).json({ success: true, data: leadsList });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

// router.put("/", async function (req, res, next) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const _id = searchParams.get("_id");
//     const updatedLead = await Leads.findByIdAndUpdate(_id, req.body);
//     res.status(200).json({ success: true, data: updatedLead });
//   } catch (error) {
//     console.log(error);
//   }
// });

// router.delete("/", async function (req, res, next) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const _id = searchParams.get("_id");
//     await Leads.findByIdAndDelete(_id);
//     const leadsList = await Leads.find().sort({ _id: -1 });
//     res.status(200).json({ success: true, data: leadsList });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

module.exports = router;
