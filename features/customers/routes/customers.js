/**
 * Customers Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as customersService from "../services/customersService.js";

const router = Router();

router.post("/", async function (req, res) {
  try {
    const customer = await customersService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
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

    const result = await customersService.getAllCustomers({
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

router.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!customersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const customer = await customersService.getCustomerById(id);
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "CUSTOMER_NOT_FOUND",
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!customersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
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

    const customer = await customersService.updateCustomer(id, req.body);
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "CUSTOMER_NOT_FOUND",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.errors
          ? Object.values(error.errors).map((err) => err.message)
          : [error.message],
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

router.delete("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    if (!customersService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

    const result = await customersService.deleteCustomer(id);
    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: "CUSTOMER_NOT_FOUND",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
