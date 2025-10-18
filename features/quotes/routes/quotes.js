/**
 * Quotes Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as quotesService from "../services/quotesService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";

const router = Router();

// POST /quotes - Create a new quote
router.post("/", validateAndRecalculateProducts, async function (req, res) {
  try {
    const quote = await quotesService.createQuote(req.body);
    res.status(201).json({ success: true, data: quote });
  } catch (error) {

    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /quotes - Get all quotes with pagination, sorting, and filtering
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

    const result = await quotesService.getAllQuotes({
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

// GET /quotes/:id - Get single quote
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

// PUT /quotes/:id - Update quote by ID
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
        details: Object.values(error.errors).map((err) => err.message),
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

// DELETE /quotes/:id - Delete quote by ID
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

    res.status(500).json({
      success: false,
      message: "Failed to delete quote",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// POST /quotes/:id/pdf - Generate PDF for quote
router.post(
  "/:id/pdf",
  validateAndRecalculateProducts,
  async function (req, res) {
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
          message: "Request body is required for PDF generation",
          error: "EMPTY_REQUEST_BODY",
        });
      }

      const quote = await quotesService.getQuoteById(id);

      // Use fresh data from request body for PDF generation
      const pdfData = {
        ...req.body,
        _id: id,
        quoteNo: req.body.quoteNo || quote.quoteNo,
        createdAt: req.body.createdAt || quote.createdAt,
      };

      // Generate PDF (delegated to pdfService cross-cutting concern)
      const { generateQuotePDF } = await import("../../../services/pdfService.js");
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


      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: error.message,
          error: "QUOTE_NOT_FOUND",
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

// POST /quotes/:id/email - Send quote via email
router.post(
  "/:id/email",
  validateAndRecalculateProducts,
  async function (req, res) {
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
          message: "Request body is required for email sending",
          error: "EMPTY_REQUEST_BODY",
        });
      }

      const quote = await quotesService.getQuoteById(id);

      // Use fresh data from request body
      const emailData = {
        ...req.body,
        _id: id,
        quoteNo: req.body.quoteNo || quote.quoteNo,
        createdAt: req.body.createdAt || quote.createdAt,
      };

      // Generate PDF and send email
      const { generateQuotePDF } = await import("../../../services/pdfService.js");
      const { sendQuoteEmail } = await import("../../../services/emailService.js");

      const pdfUrls = await generateQuotePDF(emailData, id);
      await sendQuoteEmail(emailData, id, pdfUrls.pdfUrl);

      // Update email status
      const updatedQuote = await quotesService.updateQuote(id, {
        ...emailData,
        emailStatus: "Sent",
      });

      res.status(200).json({
        success: true,
        message: "Quote email sent successfully",
        data: {
          ...updatedQuote.toObject(),
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
          details: Object.values(error.errors).map((err) => err.message),
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
