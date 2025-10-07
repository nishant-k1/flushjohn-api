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

// PUT /jobOrders/:id - Update job order by ID
router.put("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for update",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    const emailStatus = "Pending";
    const updatedJobOrder = await JobOrders.findByIdAndUpdate(
      _id,
      { ...req.body, emailStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedJobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    res.status(200).json({ success: true, data: updatedJobOrder });
  } catch (error) {
    console.error("❌ Error updating job order:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update job order",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /jobOrders/:id - Delete job order by ID
router.delete("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Check if job order exists before deletion
    const existingJobOrder = await JobOrders.findById(_id);
    if (!existingJobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    await JobOrders.findByIdAndDelete(_id);

    res.status(200).json({
      success: true,
      message: "Job order deleted successfully",
      data: { _id },
    });
  } catch (error) {
    console.error("❌ Error deleting job order:", error);

    // Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete job order",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// POST /jobOrders/:id/pdf - Generate PDF for job order
router.post("/:id/pdf", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for PDF generation",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    // Find the job order
    const jobOrder = await JobOrders.findById(_id);
    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    // TODO: Implement actual PDF generation logic here
    // For now, return success response
    res.status(201).json({
      success: true,
      message: "PDF generated successfully",
      data: { _id, pdfUrl: `/temp/job_order_${_id}.pdf` },
    });
  } catch (error) {
    console.error("❌ Error generating job order PDF:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// POST /jobOrders/:id/email - Send job order via email
router.post("/:id/email", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for email sending",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    // Find and update the job order
    const updatedJobOrder = await JobOrders.findByIdAndUpdate(
      _id,
      { ...req.body, emailStatus: "Sent", updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedJobOrder) {
      return res.status(404).json({
        success: false,
        message: "Job order not found",
        error: "JOB_ORDER_NOT_FOUND",
      });
    }

    // TODO: Implement actual email sending logic here
    // For now, return success response
    res.status(200).json({
      success: true,
      message: "Job order email sent successfully",
      data: updatedJobOrder,
    });
  } catch (error) {
    console.error("❌ Error sending job order email:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
