import { Router } from "express";
const router = Router();
import SalesOrders from "../models/SalesOrders/index.js";
import Customers from "../models/Customers/index.js";

// POST: Create a new sales order
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const body = req.body;

    // Basic validation
    if (!body.email || !body.quoteNo) {
      return res.status(400).json({
        success: false,
        error: "Email and Quote Number are required.",
      });
    }

    const latestSalesOrder = await SalesOrders.findOne({}, "salesOrderNo").sort(
      { salesOrderNo: -1 }
    );
    const latestSalesOrderNo = latestSalesOrder
      ? latestSalesOrder.salesOrderNo
      : 999;
    const newSalesOrderNo = latestSalesOrderNo + 1;

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
      // Remove array fields from body to avoid conflicts with $push
      const { quoteNo, salesOrderNo, ...customerData } = body;

      customer = await Customers.findOneAndUpdate(
        { email: body?.email },
        {
          $set: {
            ...customerData, // Set all fields except arrays
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
      emailStatus: "Pending", // Reset email status for new sales order
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

// PUT /salesOrders/:id - Update sales order by ID
router.put("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
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
    const updatedSalesOrder = await SalesOrders.findByIdAndUpdate(
      _id,
      { ...req.body, emailStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedSalesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
        error: "SALES_ORDER_NOT_FOUND",
      });
    }

    res.status(200).json({ success: true, data: updatedSalesOrder });
  } catch (error) {
    console.error("❌ Error updating sales order:", error);

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
      message: "Failed to update sales order",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /salesOrders/:id - Delete sales order by ID
router.delete("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Check if sales order exists before deletion
    const existingSalesOrder = await SalesOrders.findById(_id);
    if (!existingSalesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
        error: "SALES_ORDER_NOT_FOUND",
      });
    }

    await SalesOrders.findByIdAndDelete(_id);

    res.status(200).json({
      success: true,
      message: "Sales order deleted successfully",
      data: { _id },
    });
  } catch (error) {
    console.error("❌ Error deleting sales order:", error);

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
      message: "Failed to delete sales order",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// POST /salesOrders/:id/pdf - Generate PDF for sales order
router.post("/:id/pdf", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
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

    // Find the sales order to verify it exists
    const salesOrder = await SalesOrders.findById(_id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
        error: "SALES_ORDER_NOT_FOUND",
      });
    }

    // Use the fresh data from request body for PDF generation
    const pdfData = {
      ...req.body,
      _id: _id,
      salesOrderNo: req.body.salesOrderNo || salesOrder.salesOrderNo,
      createdAt: req.body.createdAt || salesOrder.createdAt,
    };

    // Generate PDF using new service
    const { generateSalesOrderPDF } = await import("../services/pdfService.js");
    const pdfUrls = await generateSalesOrderPDF(pdfData, _id);

    res.status(201).json({
      success: true,
      message: "Sales Order PDF generated and uploaded to S3",
      data: {
        _id,
        pdfUrl: pdfUrls.pdfUrl, // Direct API URL
        s3Url: pdfUrls.cdnUrl, // CDN URL (CloudFront if configured)
      },
    });
  } catch (error) {
    console.error("❌ Error generating sales order PDF:", error);

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

// POST /salesOrders/:id/email - Send sales order via email
router.post("/:id/email", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
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

    // Find the sales order to verify it exists
    const salesOrder = await SalesOrders.findById(_id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
        error: "SALES_ORDER_NOT_FOUND",
      });
    }

    // Use the fresh data from request body
    const emailData = {
      ...req.body,
      _id: _id,
      salesOrderNo: req.body.salesOrderNo || salesOrder.salesOrderNo,
      createdAt: req.body.createdAt || salesOrder.createdAt,
    };

    // Generate PDF and send email using new services
    const { generateSalesOrderPDF } = await import("../services/pdfService.js");
    const { sendSalesOrderEmail } = await import("../services/emailService.js");

    const pdfUrls = await generateSalesOrderPDF(emailData, _id);
    await sendSalesOrderEmail(emailData, _id, pdfUrls.cdnUrl);

    // Update sales order status
    const updatedSalesOrder = await SalesOrders.findByIdAndUpdate(
      _id,
      { emailStatus: "Sent", updatedAt: new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Sales order email sent successfully",
      data: {
        ...updatedSalesOrder.toObject(),
        pdfUrl: pdfUrls.cdnUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error sending sales order email:", error);

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
