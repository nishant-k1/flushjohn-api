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
  validateCreateLead,
  validateUpdateLead,
  validateLeadId,
  validateGetLeads,
  handleValidationErrors,
} from "../validators/leadValidator.js";
import {
  RESOURCES,
  ACTIONS,
  canCreate,
  canRead,
  canUpdate,
  canDelete,
} from "../../auth/middleware/permissions.js";

const router = Router();

// POST /leads is now public (handled in app.js)
// This route is kept for backward compatibility but won't be used
// since app.js handles POST /leads before this router
router.post(
  "/",
  authenticateToken,
  canCreate(RESOURCES.LEADS),
  validateCreateLead,
  handleValidationErrors,
  validateAndRecalculateProducts,
  async function (req, res, next) {
    try {
      const lead = await leadsService.createLead(req.body);

      // OPTIMIZATION: Emit only the new lead instead of fetching all leads
      if (global.leadsNamespace) {
        try {
          const payload = { lead: lead.toObject ? lead.toObject() : lead, action: "add" };
          global.leadsNamespace.emit("leadCreated", payload);
          console.log("📢 Emitted leadCreated event to socket clients");
        } catch (emitError) {
          console.error("❌ Error emitting leadCreated event:", emitError);
        }
      }

      res.status(201).json({
        success: true,
        message: "Lead created successfully",
        data: lead,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: "VALIDATION_ERROR",
          details: error.errors ? Object.values(error.errors).map((err) => err.message) : [error.message],
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Lead already exists",
          error: "DUPLICATE_LEAD",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create lead",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

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
        ...columnFilters
      } = req.query;

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
        ...columnFilters,
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
          details: error.message,
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
          message: error.message,
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
          details: error.message,
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
          message: error.message,
          error: "LEAD_NOT_FOUND",
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: "VALIDATION_ERROR",
          details: error.errors ? Object.values(error.errors).map((err) => err.message) : [error.message],
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
          details: error.message,
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
          message: error.message,
          error: "LEAD_NOT_FOUND",
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          error: "VALIDATION_ERROR",
          details: error.errors ? Object.values(error.errors).map((err) => err.message) : [error.message],
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
          details: error.message,
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
          message: error.message,
          error: "LEAD_NOT_FOUND",
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
          details: error.message,
        }),
      });
    }
  }
);

router.post("/test-alerts", async function (req, res, next) {
  try {
    const result = await alertService.testConnection();

    res.status(200).json({
      success: result.success,
      message: result.message || "Alert test completed",
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
