/**
 * Leads Routes - HTTP Request Handling Layer
 *
 * This layer handles HTTP requests/responses only.
 * All business logic is delegated to the service layer.
 */

import { Router } from "express";
import * as leadsService from "../services/leadsService.js";
import alertService from "../../common/services/alertService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";
import { authenticateToken } from "../../auth/middleware/auth.js";
import {
  validateUpdateLead,
  validateLeadId,
  validateGetLeads,
  handleValidationErrors,
} from "../validators/leadValidator.js";
import {
  RESOURCES,
  canRead,
  canUpdate,
  canDelete,
} from "../../auth/middleware/permissions.js";

const router: any = Router();

// POST /leads is now handled as a public endpoint in app.ts
// This route has been removed as it's no longer needed

// GET /leads - Get all leads with filtering, pagination, and search
router.get(
  "/",
  authenticateToken,
  canRead(RESOURCES.LEADS),
  validateGetLeads,
  handleValidationErrors,
  async function (req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "desc";
      const {
        status,
        assignedTo,
        leadSource,
        search,
        hasCustomerNo,
        createdAtStart,
        createdAtEnd,
        deliveryDateStart,
        deliveryDateEnd,
        pickupDateStart,
        pickupDateEnd,
        page: _page,
        limit: _limit,
        sortBy: _sortBy,
        sortOrder: _sortOrder,
        search: _search,
        ...columnFilters
      } = req.query;
      
      // Exclude explicitly handled parameters from columnFilters to prevent overrides
      const excludedKeys = [
        "status",
        "assignedTo",
        "leadSource",
        "hasCustomerNo",
        "createdAtStart",
        "createdAtEnd",
        "deliveryDateStart",
        "deliveryDateEnd",
        "pickupDateStart",
        "pickupDateEnd",
      ];
      const filteredColumnFilters = Object.fromEntries(
        Object.entries(columnFilters).filter(([key]) => !excludedKeys.includes(key))
      );

      const validationErrors = leadsService.validatePaginationParams(
        page,
        limit
      );
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: validationErrors.join(", "),
          error: "INVALID_PARAMETERS",
        });
      }

      const result = await leadsService.getAllLeads({
        page,
        limit,
        sortBy,
        sortOrder,
        status,
        assignedTo,
        leadSource,
        search,
        hasCustomerNo,
        createdAtStart,
        createdAtEnd,
        deliveryDateStart,
        deliveryDateEnd,
        pickupDateStart,
        pickupDateEnd,
        ...filteredColumnFilters,
      });

      res.status(200).json({
        success: true,
        message: "Leads retrieved successfully",
        ...result,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: "INVALID_ID_FORMAT",
        });
      }

      console.error("Error retrieving leads:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve leads",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: (error as any).message,
          stack: error.stack,
        }),
      });
    }
  }
);

router.get(
  "/:id",
  authenticateToken,
  canRead(RESOURCES.LEADS),
  validateLeadId,
  handleValidationErrors,
  async function (req, res, next) {
    try {
      const { id } = req.params;
      const lead = await leadsService.getLeadById(id);

      res.status(200).json({
        success: true,
        message: "Lead retrieved successfully",
        data: lead,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: (error as any).message,
          error: "LEAD_NOT_FOUND",
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
        message: "Failed to retrieve lead",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: (error as any).message,
        }),
      });
    }
  }
);

router.put(
  "/:id",
  authenticateToken,
  canUpdate(RESOURCES.LEADS),
  validateUpdateLead,
  handleValidationErrors,
  validateAndRecalculateProducts,
  async function (req, res, next) {
    try {
      const { id } = req.params;

      if (!leadsService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID format",
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

      const lead = await leadsService.updateLead(id, req.body);

      res.status(200).json({
        success: true,
        message: "Lead updated successfully",
        data: lead,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: (error as any).message,
          error: "LEAD_NOT_FOUND",
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
        ...(process.env.NODE_ENV === "development" && {
          details: (error as any).message,
        }),
      });
    }
  }
);

router.put(
  "/update/:id",
  authenticateToken,
  validateAndRecalculateProducts,
  async function (req, res, next) {
    try {
      const { id } = req.params;

      if (!leadsService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID format",
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

      const lead = await leadsService.updateLead(id, req.body);

      res.status(200).json({
        success: true,
        message: "Lead updated successfully",
        data: lead,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: (error as any).message,
          error: "LEAD_NOT_FOUND",
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
        ...(process.env.NODE_ENV === "development" && {
          details: (error as any).message,
        }),
      });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  canDelete(RESOURCES.LEADS),
  validateLeadId,
  handleValidationErrors,
  async function (req, res, next) {
    try {
      const { id } = req.params;
      const result = await leadsService.deleteLead(id);

      res.status(200).json({
        success: true,
        message: "Lead deleted successfully",
        data: result,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.status(404).json({
          success: false,
          message: (error as any).message,
          error: "LEAD_NOT_FOUND",
        });
      }

      if (error.name === "DeletionBlockedError") {
        return res.status(403).json({
          success: false,
          message: (error as any).message,
          error: "DELETION_BLOCKED",
          details: error.details,
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
        message: "Failed to delete lead",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: (error as any).message,
        }),
      });
    }
  }
);

router.post("/test-alerts", async function (req, res, next) {
  try {
    const result = await alertService.testConnection();

    res.status(200).json({
      success: (result as any).success,
      message: (result as any).message || "Alert test completed",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to test alerts",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;
