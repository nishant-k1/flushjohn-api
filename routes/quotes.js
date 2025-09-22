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

// PUT /quotes - Update quote
router.put("/", async function (req, res) {
  try {
    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Quote ID is required",
      });
    }

    const emailStatus = "Pending";
    const updatedQuote = await Quotes.findByIdAndUpdate(
      _id,
      { ...updateData, emailStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedQuote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    res.status(200).json({ success: true, data: updatedQuote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /quotes - Delete quote
router.delete("/", async function (req, res) {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Quote ID is required",
      });
    }

    const deletedQuote = await Quotes.findByIdAndDelete(_id);

    if (!deletedQuote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found",
      });
    }

    // Return updated list after deletion
    const quotesList = await Quotes.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Quote deleted successfully",
      data: quotesList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
