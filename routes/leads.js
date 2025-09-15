import { Router } from "express";
var router = Router();
import Leads from "../models/Leads/index.js";

const productsData = (leadSource, products) => {
  let transformedProductsData = [...products];
  if (leadSource === "Web Quick Lead" || leadSource === "Web Hero Quick Lead") {
    transformedProductsData = products.map((item) => ({
      item: item,
      desc: "",
      qty: "",
      rate: "",
      amount: "",
    }));
  } else if (leadSource === "Web Lead") {
    transformedProductsData = products.map((item) => ({
      item: item.name,
      desc: "",
      qty: item.qty,
      rate: "",
      amount: "",
    }));
  } else if (leadSource === "Call Lead") {
    return transformedProductsData;
  } else return transformedProductsData;
};

const leadData = ({ leadSource, products, ...restArgs }) => ({
  leadSource,
  products: productsData(leadSource, products),
  ...restArgs,
});

router.post("/", async function (req, res, next) {
  try {
    // ✅ ERROR HANDLING FIX: Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    const createdAt = new Date();
    const latestLead = await Leads.findOne({}, "leadNo").sort({
      leadNo: -1,
    });
    const latestLeadNo = latestLead ? latestLead.leadNo : 999;
    const newLeadNo = latestLeadNo + 1;
    const leadNo = newLeadNo;
    const webLead = leadData({ ...req.body, createdAt, leadNo });
    const lead = await Leads.create(webLead);

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("❌ Error creating lead:", error);

    // ✅ ERROR HANDLING FIX: Handle specific error types
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Lead already exists",
        error: "DUPLICATE_LEAD",
      });
    }

    // ✅ ERROR HANDLING FIX: Generic server error
    res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.get("/", async function (req, res, next) {
  try {
    const _id = req.query._id;

    if (_id) {
      // ✅ ERROR HANDLING FIX: Validate MongoDB ObjectId format
      if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      const lead = await Leads.findById(_id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
          error: "LEAD_NOT_FOUND",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lead retrieved successfully",
        data: lead,
      });
    } else {
      // ✅ PERFORMANCE FIX: Implement pagination and proper sorting
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "desc";
      const status = req.query.status;
      const assignedTo = req.query.assignedTo;
      const leadSource = req.query.leadSource;
      const search = req.query.search;

      // Validate pagination parameters
      if (page < 1) {
        return res.status(400).json({
          success: false,
          message: "Page number must be greater than 0",
          error: "INVALID_PAGE_NUMBER",
        });
      }

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 100",
          error: "INVALID_LIMIT",
        });
      }

      // Build query filters
      const query = {};

      if (status) {
        query.leadStatus = status;
      }

      if (assignedTo) {
        query.assignedTo = assignedTo;
      }

      if (leadSource) {
        query.leadSource = leadSource;
      }

      if (search) {
        // ✅ PERFORMANCE FIX: Text search across multiple fields
        query.$or = [
          { fName: { $regex: search, $options: "i" } },
          { lName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort = {};
      const validSortFields = [
        "createdAt",
        "leadNo",
        "leadStatus",
        "assignedTo",
        "leadSource",
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      const sortDirection = sortOrder === "asc" ? 1 : -1;
      sort[sortField] = sortDirection;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // ✅ PERFORMANCE FIX: Use efficient queries with pagination
      const [leadsList, totalCount] = await Promise.all([
        Leads.find(query).sort(sort).skip(skip).limit(limit).lean(), // Use lean() for better performance
        Leads.countDocuments(query),
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        message: "Leads retrieved successfully",
        data: leadsList,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
        filters: {
          sortBy: sortField,
          sortOrder,
          status,
          assignedTo,
          leadSource,
          search,
        },
      });
    }
  } catch (error) {
    console.error("❌ Error retrieving leads:", error);

    // ✅ ERROR HANDLING FIX: Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve leads",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.put("/", async function (req, res, next) {
  try {
    const _id = req.query._id;

    // ✅ ERROR HANDLING FIX: Validate required parameters
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
        error: "MISSING_LEAD_ID",
      });
    }

    // ✅ ERROR HANDLING FIX: Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // ✅ ERROR HANDLING FIX: Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is required for update",
        error: "EMPTY_REQUEST_BODY",
      });
    }

    const lead = await Leads.findByIdAndUpdate(
      _id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "LEAD_NOT_FOUND",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("❌ Error updating lead:", error);

    // ✅ ERROR HANDLING FIX: Handle specific error types
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
      message: "Failed to update lead",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.delete("/", async function (req, res, next) {
  try {
    const _id = req.query._id;

    // ✅ ERROR HANDLING FIX: Validate required parameters
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
        error: "MISSING_LEAD_ID",
      });
    }

    // ✅ ERROR HANDLING FIX: Validate MongoDB ObjectId format
    if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    // ✅ ERROR HANDLING FIX: Check if lead exists before deletion
    const existingLead = await Leads.findById(_id);
    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
        error: "LEAD_NOT_FOUND",
      });
    }

    await Leads.findByIdAndDelete(_id);

    // ✅ PERFORMANCE FIX: Use efficient query for updated list
    const leadsList = await Leads.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      data: leadsList,
      count: leadsList.length,
    });
  } catch (error) {
    console.error("❌ Error deleting lead:", error);

    // ✅ ERROR HANDLING FIX: Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
