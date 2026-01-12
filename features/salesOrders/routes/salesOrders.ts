/**
 * Sales Orders Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as salesOrdersService from "../services/salesOrdersService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router: any = Router();

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
      startDate = null,
      endDate = null,
      page: _page,
      limit: _limit,
      sortBy: _sortBy,
      sortOrder: _sortOrder,
      search: _search,
      searchQuery: _searchQuery,
      startDate: _startDate,
      endDate: _endDate,
      ...columnFilters
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
      startDate: startDate || null,
      endDate: endDate || null,
      ...columnFilters,
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

router.patch("/:id", validateAndRecalculateProducts, async function (req, res) {
  try {
    const { id } = req.params;
    
    // CRITICAL FIX: Validate ObjectId format before database query
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
        details: error.errors
          ? Object.values(error.errors).map((err: any) => err.message)
          : [(error as any).message],
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
    const { id } = req.params;
    try {
      if (!salesOrdersService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const salesOrder = await salesOrdersService.getSalesOrderById(id);

      // Use ONLY database data for PDF generation (industry standard)
      const salesOrderObj = salesOrder.toObject
        ? salesOrder.toObject()
        : salesOrder;

      // Flatten lead fields for PDF template (template expects fName, lName, email at top level)
      // Note: Contact fields (fName, lName, etc.) ONLY exist in lead object, not on sales order
      const leadData = salesOrderObj.lead || {};

      const pdfData = {
        ...salesOrderObj, // Use ONLY database data
        // Flatten lead fields to top level for PDF template (NO fallbacks - use database data only)
        fName: leadData.fName,
        lName: leadData.lName,
        cName: leadData.cName,
        email: leadData.email,
        phone: leadData.phone,
        fax: leadData.fax,
        streetAddress: leadData.streetAddress,
        city: leadData.city,
        state: leadData.state,
        zip: leadData.zip,
        country: leadData.country,
        usageType: leadData.usageType,
        _id: id,
        // Keep lead object for backward compatibility
        lead: salesOrderObj.lead,
      };

      const { generateSalesOrderPDF } =
        await import("../../fileManagement/services/pdfService.js");
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

      console.error("❌ Sales order PDF generation error:", {
        salesOrderId: id,
        error: (error as any).message,
        stack: (error as any).stack,
      });

      res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
          stack: error.stack,
        }),
      });
    }
  }
);

router.post(
  "/:id/email",
  validateAndRecalculateProducts,
  async function (req, res) {
    const { id } = req.params;
    try {
      if (!salesOrdersService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sales order ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const salesOrder = await salesOrdersService.getSalesOrderById(id);

      // Use ONLY database data for email generation (industry standard)
      const salesOrderObj = salesOrder.toObject
        ? salesOrder.toObject()
        : salesOrder;

      // Flatten lead fields for email template (template expects fName, lName, email at top level)
      // Note: Contact fields (fName, lName, etc.) ONLY exist in lead object, not on sales order
      const leadData = salesOrderObj.lead || {};

      const emailData = {
        ...salesOrderObj, // Use ONLY database data
        // Flatten lead fields to top level for email template (NO fallbacks - use database data only)
        fName: leadData.fName,
        lName: leadData.lName,
        cName: leadData.cName,
        email: leadData.email,
        phone: leadData.phone,
        fax: leadData.fax,
        streetAddress: leadData.streetAddress,
        city: leadData.city,
        state: leadData.state,
        zip: leadData.zip,
        country: leadData.country,
        usageType: leadData.usageType,
        _id: id,
        // Keep lead object for backward compatibility
        lead: salesOrderObj.lead,
      };

      // Generate payment link if requested (paymentLinkUrl in request body)
      // Note: Payment link generation is still allowed from request body as it's a runtime action
      let paymentLinkUrl = req.body.paymentLinkUrl || null;
      if (!paymentLinkUrl && req.body.includePaymentLink) {
        try {
          const paymentsService =
            await import("../../payments/services/paymentsService.js");
          const paymentLinkData =
            await paymentsService.createSalesOrderPaymentLink(id, undefined);
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

      const { generateSalesOrderPDF } =
        await import("../../fileManagement/services/pdfService.js");
      const { sendSalesOrderEmail, sendInvoiceEmail } =
        await import("../../common/services/emailService.js");

      let pdfUrls;
      const totalStartTime = Date.now();
      try {
        const pdfStartTime = Date.now();
        pdfUrls = await generateSalesOrderPDF(emailData, id);
        const pdfTime = Date.now() - pdfStartTime;
        console.log(`⏱️ [SalesOrder ${id}] PDF generation: ${pdfTime}ms`);

        // OPTIMIZATION: Pass PDF buffer directly to avoid re-downloading from S3
        const emailStartTime = Date.now();
        // Use invoice template if payment link is provided, otherwise use sales order template
        if (paymentLinkUrl) {
          await sendInvoiceEmail(
            emailData,
            id,
            pdfUrls.pdfUrl,
            paymentLinkUrl,
            pdfUrls.pdfBuffer
          );
        } else {
          await sendSalesOrderEmail(
            emailData,
            id,
            pdfUrls.pdfUrl,
            null,
            pdfUrls.pdfBuffer
          );
        }
        const emailTime = Date.now() - emailStartTime;
        console.log(`⏱️ [SalesOrder ${id}] Email sending: ${emailTime}ms`);
      } catch (pdfError) {
        // Distinguish between PDF generation errors and email sending errors
        if (pdfError.message?.includes("PDF generation failed")) {
          throw new Error(`PDF generation failed: ${pdfError.message}`);
        }
        throw pdfError;
      }

      // CRITICAL FIX: Improved background database update with retry logic
      // Update database in background (non-blocking) - respond immediately
      // This allows the API to return faster while DB update happens asynchronously
      // Note: Only update emailStatus - use database data, not emailData payload
      const dbUpdateStartTime = Date.now();
      const updateWithRetry = async (retries = 3): Promise<void> => {
        try {
          const updatedSalesOrder = await salesOrdersService.updateSalesOrder(id, {
            emailStatus: "Sent",
          });
          const dbTime = Date.now() - dbUpdateStartTime;
          console.log(
            `⏱️ [SalesOrder ${id}] Database update completed (background): ${dbTime}ms`
          );
          
          // Note: Customer creation/linking is now done only when payment is fully received
          // This ensures leads only become customers after payment success
        } catch (dbError: any) {
          if (retries > 0 && dbError.name !== "ValidationError" && dbError.name !== "NotFoundError") {
            // Retry transient errors (network, timeout, etc.)
            console.warn(
              `⚠️ [SalesOrder ${id}] Database update failed, retrying... (${retries} retries left)`,
              dbError.message || String(dbError)
            );
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
            return updateWithRetry(retries - 1);
          }
          // Log final failure after retries exhausted or non-retryable error
          console.error(
            `❌ [SalesOrder ${id}] Background database update failed after retries:`,
            {
              error: dbError.message || String(dbError),
              name: dbError.name,
              stack: dbError.stack,
            }
          );
          // TODO: Consider adding to a failed jobs queue for manual retry
        }
      };
      
      // Start background update (fire and forget with retry)
      updateWithRetry().catch((finalError: any) => {
        console.error(
          `❌ [SalesOrder ${id}] Fatal error in background update:`,
          finalError.message || String(finalError)
        );
      });

      const totalTime = Date.now() - totalStartTime;
      console.log(`⏱️ [SalesOrder ${id}] Total email flow (response sent): ${totalTime}ms`);

      res.status(200).json({
        success: true,
        message: "Sales Order email sent successfully",
        data: {
          _id: id,
          salesOrderNo: emailData.salesOrderNo,
          emailStatus: "Sent",
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

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: "VALIDATION_ERROR",
          details: error.errors
            ? Object.values(error.errors).map((err: any) => err.message)
            : [(error as any).message],
        });
      }

      // Enhanced error logging with more context
      const errorMessage = (error as any).message || String(error);
      const errorCode = (error as any).code;
      const errorResponse = (error as any).response;
      const errorResponseCode = (error as any).responseCode;

      console.error("❌ Sales order email sending error:", {
        salesOrderId: id,
        error: errorMessage,
        code: errorCode,
        responseCode: errorResponseCode,
        response: errorResponse,
        name: error.name,
        stack: error.stack,
      });

      // Provide more specific error messages based on error type
      let userFriendlyMessage = "Failed to send email";
      let errorType = "INTERNAL_SERVER_ERROR";

      // Check for common error patterns
      if (errorMessage?.includes("Email authentication failed") || errorCode === "EAUTH" || errorResponseCode === 535) {
        userFriendlyMessage = "Email authentication failed. Please check email service configuration.";
        errorType = "EMAIL_AUTH_ERROR";
      } else if (errorMessage?.includes("Email server not found") || errorCode === "ENOTFOUND") {
        userFriendlyMessage = "Email server connection failed. Please check network configuration.";
        errorType = "EMAIL_CONNECTION_ERROR";
      } else if (errorMessage?.includes("PDF generation failed")) {
        userFriendlyMessage = "Failed to generate PDF document.";
        errorType = "PDF_GENERATION_ERROR";
      } else if (errorMessage?.includes("S3") || errorMessage?.includes("AWS")) {
        userFriendlyMessage = "Failed to upload PDF to storage. Please check storage configuration.";
        errorType = "STORAGE_ERROR";
      } else if (errorMessage?.includes("email") && errorMessage?.includes("required") || errorMessage?.includes("missing")) {
        userFriendlyMessage = "Required email configuration is missing.";
        errorType = "CONFIGURATION_ERROR";
      }

      res.status(500).json({
        success: false,
        message: userFriendlyMessage,
        error: errorType,
        // Include error message in production for better debugging (but not stack trace)
        ...(process.env.NODE_ENV === "development" ? {
          details: errorMessage,
          stack: error.stack,
        } : {
          details: errorMessage, // Include message even in production to help diagnose
        }),
      });
    }
  }
);

export default router;
