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

// PUT /customers - Update customer
router.put("/", async function (req, res) {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const updatedCustomer = await Customers.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /customers - Delete customer
router.delete("/", async function (req, res) {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const deletedCustomer = await Customers.findByIdAndDelete(_id);

    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Return updated list after deletion
    const customersList = await Customers.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: customersList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
