import { Router } from "express";
const router = Router();
import SalesOrders from "../models/SalesOrders/index.js";
import Customers from "../models/Customers/index.js";

// POST: Create a new sales order
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestSalesOrder = await SalesOrders.findOne({}, "salesOrderNo").sort(
      { salesOrderNo: -1 }
    );
    const latestSalesOrderNo = latestSalesOrder
      ? latestSalesOrder.salesOrderNo
      : 999;
    const newSalesOrderNo = latestSalesOrderNo + 1;

    // Parse request body
    const body = req.body;

    // Basic validation
    if (!body.email || !body.quoteNo) {
      return res.status(400).json({
        success: false,
        error: "Email and Quote Number are required.",
      });
    }

    // Handle customer creation/update logic
    let customer = await Customers.findOne({ email: body?.email });
    const latestCustomer = await Customers.findOne({}, "customerNo").sort({
      customerNo: -1,
    });
    const customerNo = latestCustomer ? latestCustomer.customerNo + 1 : 999;

    if (!customer) {
      customer = await Customers.create({
        ...body,
        createdAt,
        customerNo,
        salesOrderNo: [newSalesOrderNo],
        quoteNo: [body?.quoteNo] || [],
      });
    } else {
      customer = await Customers.findOneAndUpdate(
        { email: body?.email },
        {
          $set: {
            ...body,
          },
          $push: {
            salesOrderNo: newSalesOrderNo,
            quoteNo: body?.quoteNo,
          },
        },
        {
          new: true,
        }
      );
    }

    const newSalesOrder = await SalesOrders.create({
      ...body,
      createdAt,
      salesOrderNo: newSalesOrderNo,
      customerNo: customer.customerNo,
    });

    res.status(201).json({ success: true, data: newSalesOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /salesOrders - Get all sales orders with pagination, sorting, and filtering
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
        ],
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count for pagination
    const total = await SalesOrders.countDocuments(query);

    // Get sales orders with pagination and sorting
    const salesOrders = await SalesOrders.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: salesOrders,
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

// GET /salesOrders/:id - Get single sales order
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const salesOrder = await SalesOrders.findById(id);

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    res.status(200).json({ success: true, data: salesOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /salesOrders - Update sales order
router.put("/", async function (req, res) {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Sales order ID is required",
      });
    }

    const emailStatus = "Pending";
    const updatedSalesOrder = await SalesOrders.findByIdAndUpdate(
      _id,
      { ...updateData, emailStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedSalesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    res.status(200).json({ success: true, data: updatedSalesOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /salesOrders - Delete sales order
router.delete("/", async function (req, res) {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Sales order ID is required",
      });
    }

    const deletedSalesOrder = await SalesOrders.findByIdAndDelete(_id);

    if (!deletedSalesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    // Return updated list after deletion
    const salesOrdersList = await SalesOrders.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Sales order deleted successfully",
      data: salesOrdersList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
