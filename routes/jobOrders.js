import { Router } from "express";
const router = Router();
import JobOrders from "../models/JobOrders/index.js";

// POST: Create a new job order
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestJobOrder = await JobOrders.findOne({}, "jobOrderNo").sort({
      jobOrderNo: -1,
    });
    const latestJobOrderNo = latestJobOrder ? latestJobOrder.jobOrderNo : 999;
    const newJobOrderNo = latestJobOrderNo + 1;
    const newJobOrderData = {
      ...req.body,
      createdAt,
      jobOrderNo: newJobOrderNo,
    };
    const newJobOrder = await JobOrders.create(newJobOrderData);
    res.status(201).json({ success: true, data: newJobOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /jobOrders - Get all job orders with pagination, sorting, and filtering
router.get("/", async function (req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      searchQuery = "",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query for search
    let query = {};
    const searchTerm = search || searchQuery;
    if (searchTerm) {
      query = {
        $or: [
          { customerName: { $regex: searchTerm, $options: "i" } },
          { customerEmail: { $regex: searchTerm, $options: "i" } },
          { customerPhone: { $regex: searchTerm, $options: "i" } },
          { eventLocation: { $regex: searchTerm, $options: "i" } },
          { eventCity: { $regex: searchTerm, $options: "i" } },
          { eventState: { $regex: searchTerm, $options: "i" } },
          { vendorName: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await JobOrders.countDocuments(query);

    // Get job orders with pagination and sorting
    const jobOrders = await JobOrders.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: jobOrders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /jobOrders/:id - Get single job order
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const jobOrder = await JobOrders.findById(id);

    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
      });
    }

    res.status(200).json({ success: true, data: jobOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /jobOrders - Update job order
router.put("/", async function (req, res) {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Job order ID is required",
      });
    }

    const emailStatus = "Pending";
    const updatedJobOrder = await JobOrders.findByIdAndUpdate(
      _id,
      { ...updateData, emailStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedJobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
      });
    }

    res.status(200).json({ success: true, data: updatedJobOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /jobOrders - Delete job order
router.delete("/", async function (req, res) {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Job order ID is required",
      });
    }

    const deletedJobOrder = await JobOrders.findByIdAndDelete(_id);

    if (!deletedJobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
      });
    }

    // Return updated list after deletion
    const jobOrdersList = await JobOrders.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Job order deleted successfully",
      data: jobOrdersList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
