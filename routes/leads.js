var express = require("express");

var router = express.Router();
const Leads = require("../models/Leads");

/* GET leads listing. */
router.post("/", async function (req, res, next) {
  try {
    const createdAt = new Date();
    const latestLead = await Leads.findOne({}, "leadNo").sort({
      leadNo: -1,
    });
    const latestLeadNo = latestLead ? latestLead.leadNo : 0;
    const newLeadNo = latestLeadNo + 1;
    const leadNo = newLeadNo;
    const postValue = { ...req.body, createdAt, leadNo };
    const leads = await Leads.create(postValue);
    // io.emit("create-lead");
    res.status(201).json({ success: true, data: leads.data });
  } catch (error) {
    console.log(error);
  }
});

router.get("/", async function (req, res, next) {
  try {
    // await corsHandle(req, res)
    const { _id } = req.query;
    if (_id) {
      const leads = await Leads.findById(_id);
      res.status(200).json({ success: true, data: leads });
    } else {
      const leads = await Leads.find().sort({ _id: -1 });
      // io.emit("fetch-leads");
      res.status(200).json({ success: true, data: leads });
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/", async function (req, res, next) {
  try {
    const { _id } = req.query;
    const leads = await Leads.findByIdAndUpdate(_id, req.body);
    // io.emit("update-lead");
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    console.log(error);
  }
});

router.delete("/", async function (req, res, next) {
  try {
    const { _id } = req.query;
    const leads = await Leads.findByIdAndRemove(_id);
    // io.emit("delete-lead");
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
