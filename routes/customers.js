import { Router } from "express";
const router = Router();
import Customers from "../models/Customers/index.js";

// POST: Create a new customer
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestCustomer = await Customers.findOne({}, "customerNo").sort({
      customerNo: -1,
    });
    const latestCustomerNo = latestCustomer ? latestCustomer.customerNo : 999;
    const newCustomerNo = latestCustomerNo + 1;
    const newCustomerData = {
      ...req.body,
      createdAt,
      customerNo: newCustomerNo,
    };
    const newCustomer = await Customers.create(newCustomerData);
    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /customers - Get all customers with pagination, sorting, and filtering
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
          { fName: { $regex: searchTerm, $options: "i" } },
          { lName: { $regex: searchTerm, $options: "i" } },
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
    const total = await Customers.countDocuments(query);

    // Get customers with pagination and sorting
    const customers = await Customers.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: customers,
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

// GET /customers/:id - Get single customer
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const customer = await Customers.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /customers/:id - Update customer by ID
router.put("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
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

    const updatedCustomer = await Customers.findByIdAndUpdate(
      _id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        error: "CUSTOMER_NOT_FOUND",
      });
    }

    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error("❌ Error updating customer:", error);

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
      message: "Failed to update customer",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /customers/:id - Delete customer by ID
router.delete("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Check if customer exists before deletion
    const existingCustomer = await Customers.findById(_id);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        error: "CUSTOMER_NOT_FOUND",
      });
    }

    await Customers.findByIdAndDelete(_id);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: { _id },
    });
  } catch (error) {
    console.error("❌ Error deleting customer:", error);

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
      message: "Failed to delete customer",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
