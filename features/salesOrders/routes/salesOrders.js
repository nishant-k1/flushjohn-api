/**
 * Sales Orders Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as salesOrdersService from "../services/salesOrdersService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router = Router();

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

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number",
        error: "INVALID_PAGE_NUMBER",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit. Must be between 1 and 100",
        error: "INVALID_LIMIT",
      });
    }

    const result = await salesOrdersService.getAllSalesOrders({
      page: pageNum,
      limit: limitNum,
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

router.post("/:id/cancel", async function (req, res) {
  try {
    const { id } = req.params;

    if (!salesOrdersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales order ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const cancelledSalesOrder = await salesOrdersService.cancelSalesOrder(id);
    res.status(200).json({
      success: true,
      message: "Sales Order cancelled successfully",
      data: cancelledSalesOrder,
    });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.name === "AlreadyCancelledError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.name === "UnrefundedPaymentsError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

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
        details: error.errors ? Object.values(error.errors).map((err) => err.message) : [error.message],
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

    if (error.name === "DeletionBlockedError") {
      return res.status(403).json({
        success: false,
        message: error.message,
        error: "DELETION_BLOCKED",
        details: error.details,
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

      const pdfData = {
        ...req.body,
        _id: id,
        salesOrderNo: req.body.salesOrderNo || salesOrder.salesOrderNo,
        createdAt: req.body.createdAt || salesOrder.createdAt,
      };

      const { generateSalesOrderPDF } = await import(
        "../../fileManagement/services/pdfService.js"
      );
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
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

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
      
      // Flatten lead fields for email template (template expects fName, lName, email at top level)
      const leadData = salesOrder.lead || {};
      const salesOrderObj = salesOrder.toObject ? salesOrder.toObject() : salesOrder;
      
      const emailData = {
        ...salesOrderObj, // Start with sales order data from DB
        // Flatten lead fields to top level for email template
        fName: req.body.fName || leadData.fName || salesOrderObj.fName,
        lName: req.body.lName || leadData.lName || salesOrderObj.lName,
        cName: req.body.cName || leadData.cName || salesOrderObj.cName,
        email: req.body.email || leadData.email || salesOrderObj.email,
        phone: req.body.phone || leadData.phone || salesOrderObj.phone,
        fax: req.body.fax || leadData.fax || salesOrderObj.fax,
        streetAddress: req.body.streetAddress || leadData.streetAddress || salesOrderObj.streetAddress,
        city: req.body.city || leadData.city || salesOrderObj.city,
        state: req.body.state || leadData.state || salesOrderObj.state,
        zip: req.body.zip || leadData.zip || salesOrderObj.zip,
        country: req.body.country || leadData.country || salesOrderObj.country,
        usageType: req.body.usageType || leadData.usageType || salesOrderObj.usageType,
        ...req.body, // Override with request body data
        _id: id,
        salesOrderNo: req.body.salesOrderNo || salesOrderObj.salesOrderNo,
        createdAt: req.body.createdAt || salesOrderObj.createdAt,
        // Keep lead object for backward compatibility
        lead: salesOrderObj.lead,
      };

      // Generate payment link if requested (paymentLinkUrl in request body)
      let paymentLinkUrl = req.body.paymentLinkUrl || null;
      if (!paymentLinkUrl && req.body.includePaymentLink) {
        try {
          const paymentsService = await import("../../payments/services/paymentsService.js");
          const paymentLinkData = await paymentsService.createSalesOrderPaymentLink(id);
          paymentLinkUrl = paymentLinkData.url;
        } catch (paymentLinkError) {
          // Log error but continue with email without payment link
          console.error("Failed to create payment link:", paymentLinkError);
        }
      }
      
      // Set paymentLinkUrl in emailData if it was provided or created
      if (paymentLinkUrl) {
        emailData.paymentLinkUrl = paymentLinkUrl;
      }

      const { generateSalesOrderPDF } = await import(
        "../../fileManagement/services/pdfService.js"
      );
      const { sendSalesOrderEmail, sendInvoiceEmail } = await import(
        "../../common/services/emailService.js"
      );

      let pdfUrls;
      try {
        pdfUrls = await generateSalesOrderPDF(emailData, id);
        
        // Use invoice template if payment link is provided, otherwise use sales order template
        if (paymentLinkUrl) {
          await sendInvoiceEmail(emailData, id, pdfUrls.pdfUrl, paymentLinkUrl);
        } else {
          await sendSalesOrderEmail(emailData, id, pdfUrls.pdfUrl, null);
        }
      } catch (pdfError) {
        throw pdfError;
      }

      const updatedSalesOrder = await salesOrdersService.updateSalesOrder(id, {
        ...emailData,
        emailStatus: "Sent",
      });

      // Link sales order to customer if customer exists
      // Customer will be created when job order email is sent
      await salesOrdersService.linkSalesOrderToCustomer(
        updatedSalesOrder,
        updatedSalesOrder.lead?.toString() || null
      );

      res.status(200).json({
        success: true,
        message: "Sales Order email sent successfully",
        data: {
          _id: updatedSalesOrder._id,
          salesOrderNo: updatedSalesOrder.salesOrderNo,
          emailStatus: updatedSalesOrder.emailStatus,
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
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

export default router;
