/**
 * Sales Orders Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as salesOrdersService from "../services/salesOrdersService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router = Router();

// POST /salesOrders - Create a new sales order
router.post("/", validateAndRecalculateProducts, async function (req, res) {
  try {
    const salesOrder = await salesOrdersService.createSalesOrder(req.body);
    res.status(201).json({ success: true, data: salesOrder });
  } catch (error) {


    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

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

    const result = await salesOrdersService.getAllSalesOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search: search || searchQuery,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {

    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /salesOrders/:id - Get single sales order
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!salesOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const salesOrder = await salesOrdersService.getSalesOrderById(id);
    res.status(200).json({ success: true, data: salesOrder });
  } catch (error) {


    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "SALES_ORDER_NOT_FOUND",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /salesOrders/:id - Update sales order by ID
router.put("/:id", validateAndRecalculateProducts, async function (req, res) {
  try {
    const { id } = req.params;

    if (!salesOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for update",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    const salesOrder = await salesOrdersService.updateSalesOrder(id, req.body);
    res.status(200).json({ success: true, data: salesOrder });
  } catch (error) {


    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "SALES_ORDER_NOT_FOUND",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: Object.values(error.errors).map((err) => err.message),
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
    const { id } = req.params;

    if (!salesOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const result = await salesOrdersService.deleteSalesOrder(id);
    res.status(200).json({
      success: true,
      message: "Sales order deleted successfully",
      data: result,
    });
  } catch (error) {


    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "SALES_ORDER_NOT_FOUND",
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
router.post(
  "/:id/pdf",
  validateAndRecalculateProducts,
  async function (req, res) {
    try {
      const { id } = req.params;

      if (!salesOrdersService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const salesOrder = await salesOrdersService.getSalesOrderById(id);

      // Use fresh data from request body
      const pdfData = {
        ...req.body,
        _id: id,
        salesOrderNo: req.body.salesOrderNo || salesOrder.salesOrderNo,
        createdAt: req.body.createdAt || salesOrder.createdAt,
      };

      // Generate PDF
      const { generateSalesOrderPDF } = await import("../../../services/pdfService.js");
      const pdfUrls = await generateSalesOrderPDF(pdfData, id);

      res.status(201).json({
        success: true,
        message: "Sales Order PDF generated and uploaded to S3",
        data: {
          _id: id,
          pdfUrl: pdfUrls.pdfUrl,
        },
      });
    } catch (error) {


      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "SALES_ORDER_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && { details: error.message }),
      });
    }
  }
);

// POST /salesOrders/:id/email - Send sales order via email
router.post(
  "/:id/email",
  validateAndRecalculateProducts,
  async function (req, res) {
    try {
      const { id } = req.params;

      if (!salesOrdersService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const salesOrder = await salesOrdersService.getSalesOrderById(id);

      // Use fresh data from request body
      const emailData = {
        ...req.body,
        _id: id,
        salesOrderNo: req.body.salesOrderNo || salesOrder.salesOrderNo,
        createdAt: req.body.createdAt || salesOrder.createdAt,
      };

      // Generate PDF and send email
      const { generateSalesOrderPDF } = await import("../../../services/pdfService.js");
      const { sendSalesOrderEmail } = await import("../../../services/emailService.js");

      const pdfUrls = await generateSalesOrderPDF(emailData, id);
      await sendSalesOrderEmail(emailData, id, pdfUrls.pdfUrl);

      // Update email status
      const updatedSalesOrder = await salesOrdersService.updateSalesOrder(id, {
        ...emailData,
        emailStatus: "Sent",
      });

      res.status(200).json({
        success: true,
        message: "Sales Order email sent successfully",
        data: {
          ...updatedSalesOrder.toObject(),
          pdfUrl: pdfUrls.pdfUrl,
        },
      });
    } catch (error) {


      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "SALES_ORDER_NOT_FOUND",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && { details: error.message }),
      });
    }
  }
);

export default router;
