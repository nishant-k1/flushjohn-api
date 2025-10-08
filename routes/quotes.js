import { Router } from "express";
const router = Router();
import Quotes from "../models/Quotes/index.js";

// POST: Create a new quote
router.post("/", async function (req, res) {
  try {
    const createdAt = new Date();
    const latestQuote = await Quotes.findOne({}, "quoteNo").sort({
      quoteNo: -1,
    });
    const latestQuoteNo = latestQuote ? latestQuote.quoteNo : 999;
    const newQuoteNo = latestQuoteNo + 1;
    const newQuoteData = {
      ...req.body,
      createdAt,
      quoteNo: newQuoteNo,
      emailStatus: "Pending", // Ensure new quotes start with Pending status
    };
    const newQuote = await Quotes.create(newQuoteData);
    res.status(201).json({ success: true, data: newQuote });
  } catch (error) {
    console.error(error);
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
    const total = await Quotes.countDocuments(query);

    // Get quotes with pagination and sorting
    const quotes = await Quotes.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: quotes,
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

// GET /quotes/:id - Get single quote
router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const quote = await Quotes.findById(id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /quotes/:id - Update quote by ID
router.put("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
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
    const updatedQuote = await Quotes.findByIdAndUpdate(
      _id,
      { ...req.body, emailStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedQuote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
        error: "QUOTE_NOT_FOUND",
      });
    }

    res.status(200).json({ success: true, data: updatedQuote });
  } catch (error) {
    console.error("❌ Error updating quote:", error);

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
      message: "Failed to update quote",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// DELETE /quotes/:id - Delete quote by ID
router.delete("/:id", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // Check if quote exists before deletion
    const existingQuote = await Quotes.findById(_id);
    if (!existingQuote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
        error: "QUOTE_NOT_FOUND",
      });
    }

    await Quotes.findByIdAndDelete(_id);

    res.status(200).json({
      success: true,
      message: "Quote deleted successfully",
      data: { _id },
    });
  } catch (error) {
    console.error("❌ Error deleting quote:", error);

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
      message: "Failed to delete quote",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// POST /quotes/:id/pdf - Generate PDF for quote
router.post("/:id/pdf", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
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

    // Find the quote to verify it exists
    const quote = await Quotes.findById(_id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
        error: "QUOTE_NOT_FOUND",
      });
    }

    // Use the fresh data from request body for PDF generation
    const pdfData = {
      ...req.body,
      _id: _id,
      quoteNo: req.body.quoteNo || quote.quoteNo,
      createdAt: req.body.createdAt || quote.createdAt,
    };

    // Generate PDF using new service
    const { generateQuotePDF } = await import("../services/pdfService.js");
    const pdfUrls = await generateQuotePDF(pdfData, _id);

    res.status(201).json({
      success: true,
      message: "Quote PDF generated and uploaded to S3",
      data: {
        _id,
        pdfUrl: pdfUrls.pdfUrl, // Direct API URL
        s3Url: pdfUrls.cdnUrl, // CDN URL (CloudFront if configured)
      },
    });
  } catch (error) {
    console.error("❌ Error generating quote PDF:", error);

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

// POST /quotes/:id/email - Send quote via email
router.post("/:id/email", async function (req, res) {
  try {
    const _id = req.params.id;

    // Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quote ID format",
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

    // Find the quote to verify it exists
    const quote = await Quotes.findById(_id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
        error: "QUOTE_NOT_FOUND",
      });
    }

    // Use the fresh data from request body
    const emailData = {
      ...req.body,
      _id: _id,
      quoteNo: req.body.quoteNo || quote.quoteNo,
      createdAt: req.body.createdAt || quote.createdAt,
    };

    // Generate PDF and send email using new services
    const { generateQuotePDF } = await import("../services/pdfService.js");
    const { sendQuoteEmail } = await import("../services/emailService.js");

    const pdfUrls = await generateQuotePDF(emailData, _id);
    await sendQuoteEmail(emailData, _id, pdfUrls.cdnUrl);

    // Update quote status
    const updatedQuote = await Quotes.findByIdAndUpdate(
      _id,
      { emailStatus: "Sent", updatedAt: new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Quote email sent successfully",
      data: {
        ...updatedQuote.toObject(),
        pdfUrl: pdfUrls.cdnUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error sending quote email:", error);

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
