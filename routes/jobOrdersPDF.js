const { chromium } = require("playwright");
const path = require("path");
const express = require("express");
const router = express.Router();
const JobOrders = require("../models/JobOrders");
const Vendors = require("../models/Vendors");
const template = require("../template");

const pdf = async (jobOrderData) => {
  const pdfPath = path.join(process.cwd(), "public", "temp", "job_order.pdf");
  const options = {
    path: pdfPath,
    format: "A4",
    printBackground: true,
  };

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(template(jobOrderData));
    await page.pdf(options);
    await browser.close();
    return pdfPath;
  } catch (error) {
    console.log(error);
    return null;
  }
};

router.post("/", async function (req, res, next) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    console.log("IDDDDD", _id);
    const jobOrder = await JobOrders.findById(_id);
    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: "JobOrder not found",
      });
    }

    // Since we need more details about the vendor like street address, etc.,
    // that's why fetching vendor details based on id
    const vendor = await Vendors.findById(jobOrder.vendor._id);
    const jobOrderData = { ...jobOrder._doc, vendor };

    const pdfPath = await pdf(jobOrderData);

    if (pdfPath) {
      return res.status(201).json({ success: true, data: pdfPath });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate PDF" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
});

module.exports = router;
