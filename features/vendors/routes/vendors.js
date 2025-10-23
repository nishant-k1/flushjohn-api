/**
 * Vendors Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as vendorsService from "../services/vendorsService.js";

const router = Router();

router.post("/", async function (req, res) {
  try {
    const vendor = await vendorsService.createVendor(req.body);
    res.status(201).json({ success: true, data: vendor });
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
    } = req.query;

    const result = await vendorsService.getAllVendors({
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

router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!vendorsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const vendor = await vendorsService.getVendorById(id);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "VENDOR_NOT_FOUND",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!vendorsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
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

    const vendor = await vendorsService.updateVendor(id, req.body);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "VENDOR_NOT_FOUND",
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
      message: "Failed to update vendor",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!vendorsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const result = await vendorsService.deleteVendor(id);
    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "VENDOR_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete vendor",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
