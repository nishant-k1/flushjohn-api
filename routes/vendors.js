import { Router } from "express";
const router = Router();
import Vendors from "../models/Vendors/index.js";

// POST: Create a new vendor
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestVendor = await Vendors.findOne({}, "vendorNo").sort({
      vendorNo: -1,
    });
    const latestVendorNo = latestVendor ? latestVendor.vendorNo : 999;
    const newVendorNo = latestVendorNo + 1;
    const newVendorData = {
      ...req.body,
      createdAt,
      vendorNo: newVendorNo,
    };
    const newVendor = await Vendors.create(newVendorData);
    res.status(201).json({ success: true, data: newVendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /vendors - Get all vendors with pagination, sorting, and filtering
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
          { name: { $regex: searchTerm, $options: "i" } },
          { cName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { phone: { $regex: searchTerm, $options: "i" } },
          { city: { $regex: searchTerm, $options: "i" } },
          { state: { $regex: searchTerm, $options: "i" } },
        ],
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await Vendors.countDocuments(query);

    // Get vendors with pagination and sorting
    const vendors = await Vendors.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: vendors,
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

// GET /vendors/:id - Get single vendor
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const vendor = await Vendors.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /vendors/:id - Update vendor by ID
router.put("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
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

    const updatedVendor = await Vendors.findByIdAndUpdate(
      _id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
        error: "VENDOR_NOT_FOUND",
      });
    }

    res.status(200).json({ success: true, data: updatedVendor });
  } catch (error) {
    console.error("❌ Error updating vendor:", error);

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
      message: "Failed to update vendor",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /vendors/:id - Delete vendor by ID
router.delete("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Check if vendor exists before deletion
    const existingVendor = await Vendors.findById(_id);
    if (!existingVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
        error: "VENDOR_NOT_FOUND",
      });
    }

    await Vendors.findByIdAndDelete(_id);

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
      data: { _id },
    });
  } catch (error) {
    console.error("❌ Error deleting vendor:", error);

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
      message: "Failed to delete vendor",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
