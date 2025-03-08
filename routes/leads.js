import { Router } from "express";
var router = Router();
import Leads from "../models/Leads/index.js";

const productsData = (leadSource, products) => {
  let transformedProductsData = [...products];
  if (leadSource === "Web Quick Lead" || leadSource === "Web Hero Quick Lead") {
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
  } else if (leadSource === "Call Lead") {
    return transformedProductsData;
  } else return transformedProductsData;
};

const leadData = ({ leadSource, products, ...restArgs }) => ({
  leadSource,
  products: productsData(leadSource, products),
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
    const webLead = leadData({ ...req.body, createdAt, leadNo });
    const lead = await Leads.create(webLead);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async function (req, res, next) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    if (_id) {
      const lead = await Leads.findById(_id);
      res.status(200).json({ success: true, data: lead });
    } else {
      const leadsList = await Leads.find().sort({ _id: -1 });
      res.status(200).json({ success: true, data: leadsList });
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/", async function (req, res, next) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    const lead = await Leads.findByIdAndUpdate(_id, req.body);
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/", async function (req, res, next) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    await Leads.findByIdAndDelete(_id);
    const leadsList = await Leads.find().sort({ _id: -1 });
    res.status(200).json({ success: true, data: leadsList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
