/**
 * Customers Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as customersService from "../services/customersService.js";

const router = Router();

// POST /customers - Create a new customer
router.post("/", async function (req, res) {
  try {
    const customer = await customersService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error("❌ Error creating customer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /customers - Get all customers with pagination, sorting, and filtering
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

    const result = await customersService.getAllCustomers({
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
    console.error("❌ Error retrieving customers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /customers/:id - Get single customer
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
    console.error("❌ Error retrieving customer:", error);

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

// PUT /customers/:id - Update customer by ID
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
    console.error("❌ Error updating customer:", error);

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
        details: Object.values(error.errors).map((err) => err.message),
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

// DELETE /customers/:id - Delete customer by ID
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
    console.error("❌ Error deleting customer:", error);

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
