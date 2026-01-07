/**
 * Quotes Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as quotesService from "../services/quotesService.js";
import * as quoteAIRateService from "../services/quoteAIRateService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router: any = Router();

router.post("/", validateAndRecalculateProducts, async function (req, res) {
  try {
    const quote = await quotesService.createQuote(req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (error) {
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
      page: _page,
      limit: _limit,
      sortBy: _sortBy,
      sortOrder: _sortOrder,
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

    const result = await quotesService.getAllQuotes({
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder,
      search: search || searchQuery,
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

/**
 * GET /api/quotes/ai-suggested-rate
 * Get AI suggested rate for a product based on location and historical data
 */
router.get("/ai-suggested-rate", async function (req, res) {
  try {
    const {
      zipCode,
      city,
      state,
      streetAddress,
      productItem,
      quantity,
      usageType,
    } = req.query;

    if (!zipCode && !city) {
      return res.status(400).json({
        success: false,
        message: "Location (zipCode or city) is required",
        error: "INVALID_REQUEST",
      });
    }

    if (!productItem) {
      return res.status(400).json({
        success: false,
        message: "Product item is required",
        error: "INVALID_REQUEST",
      });
    }

    const suggestedRate = await quoteAIRateService.getAISuggestedRate({
      zipCode,
      city,
      state,
      streetAddress,
      productItem,
      quantity: quantity ? parseInt(quantity, 10) : 1,
      usageType,
    });

    res.status(200).json({
      success: true,
      data: suggestedRate,
    });
  } catch (error) {
    console.error("Error getting AI suggested rate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI suggested rate",
      error: error.message,
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!quotesService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const quote = await quotesService.getQuoteById(id);
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "QUOTE_NOT_FOUND",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", validateAndRecalculateProducts, async function (req, res) {
  try {
    const { id } = req.params;

    if (!quotesService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
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

    const quote = await quotesService.updateQuote(id, req.body);
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "QUOTE_NOT_FOUND",
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
      message: "Failed to update quote",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!quotesService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const result = await quotesService.deleteQuote(id);
    res.status(200).json({
      success: true,
      message: "Quote deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "QUOTE_NOT_FOUND",
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
      message: "Failed to delete quote",
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
      if (!quotesService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quote ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is required for PDF generation",
          error: "EMPTY_REQUEST_BODY",
        });
      }

      const quote = await quotesService.getQuoteById(id);

      const pdfData = {
        ...req.body,
        _id: id,
        quoteNo: req.body.quoteNo || quote.quoteNo,
        createdAt: req.body.createdAt || quote.createdAt,
      };

      const { generateQuotePDF } = await import(
        "../../fileManagement/services/pdfService.js"
      );
      const pdfUrls = await generateQuotePDF(pdfData, id);

      res.status(201).json({
        success: true,
        message: "Quote PDF generated and uploaded to S3",
        data: {
          _id: id,
          pdfUrl: pdfUrls.pdfUrl,
        },
      });
    } catch (error) {
      // Always log the error for debugging
      console.error("❌ Quote PDF generation error:", {
        quoteId: id,
        error: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause?.message,
      });

      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "QUOTE_NOT_FOUND",
        });
      }

      // Provide more helpful error message
      const errorMessage = error.message || "Unknown error";
      const isDevelopment = process.env.NODE_ENV === "development";

      res.status(500).json({
        success: false,
        message: `Failed to generate PDF: ${errorMessage}`,
        error: "INTERNAL_SERVER_ERROR",
        ...(isDevelopment && {
          details: errorMessage,
          stack: error.stack,
          name: error.name,
        }),
        // Always include a hint about common issues
        hint: isDevelopment
          ? undefined
          : "Check server logs for details. Common issues: Playwright/Puppeteer not installed, AWS credentials missing, or template generation failed.",
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

      if (!quotesService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quote ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is required for email sending",
          error: "EMPTY_REQUEST_BODY",
        });
      }

      const quote = await quotesService.getQuoteById(id);

      const emailData = {
        ...req.body,
        _id: id,
        quoteNo: req.body.quoteNo || quote.quoteNo,
        createdAt: req.body.createdAt || quote.createdAt,
      };

      const { generateQuotePDF } = await import(
        "../../fileManagement/services/pdfService.js"
      );
      const { sendQuoteEmail } = await import(
        "../../common/services/emailService.js"
      );

      let pdfUrls;
      try {
        pdfUrls = await generateQuotePDF(emailData, id);
        await sendQuoteEmail(emailData, id, pdfUrls.pdfUrl);
      } catch (pdfError) {
        throw pdfError;
      }

      const updatedQuote = await quotesService.updateQuote(id, {
        ...emailData,
        emailStatus: "Sent",
      });

      res.status(200).json({
        success: true,
        message: "Quote email sent successfully",
        data: {
          _id: updatedQuote._id,
          quoteNo: updatedQuote.quoteNo,
          emailStatus: updatedQuote.emailStatus,
          pdfUrl: pdfUrls.pdfUrl,
        },
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "QUOTE_NOT_FOUND",
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

      console.error("❌ Quote email sending error:", {
        quoteId: id,
        error: (error as any).message,
        stack: error.stack,
        name: error.name,
      });

      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
          stack: error.stack,
        }),
      });
    }
  }
);

export default router;
