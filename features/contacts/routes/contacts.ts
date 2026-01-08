/**
 * Contacts Routes - HTTP Request Handling Layer
 *
 * This layer handles HTTP requests/responses only.
 * All business logic is delegated to the service layer.
 */

import { Router } from "express";
import * as contactsService from "../services/contactsService.js";
import { authenticateToken } from "../../auth/middleware/auth.js";
import {
  RESOURCES,
  canRead,
  canUpdate,
  canDelete,
} from "../../auth/middleware/permissions.js";
import { safeStringQuery } from "../../../types/common.js";

// Fallback for contacts resource if not defined
const CONTACTS_RESOURCE = RESOURCES.CONTACTS || "contacts";

const router: any = Router();

router.get(
  "/",
  authenticateToken,
  canRead(CONTACTS_RESOURCE),
  async function (req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "desc";
      const {
        status,
        search,
        page: _page,
        limit: _limit,
        sortBy: _sortBy,
        sortOrder: _sortOrder,
        ...columnFilters
      } = req.query;

      const validationErrors = contactsService.validatePaginationParams(
        page,
        limit
      );
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: validationErrors.join(", "),
        });
        return;
      }

      const result = await contactsService.getAllContacts({
        page,
        limit,
        sortBy: safeStringQuery(sortBy, "createdAt"),
        sortOrder: safeStringQuery(sortOrder, "desc"),
        status: status ? safeStringQuery(status) : undefined,
        search: search ? safeStringQuery(search) : undefined,
        ...columnFilters,
      });

      res.status(200).json({
        success: true,
        message: "Contacts retrieved successfully",
        ...result,
      });
    } catch (error) {
      if (error.name === "CastError") {
        res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve contacts",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

router.get(
  "/:id",
  authenticateToken,
  canRead(CONTACTS_RESOURCE),
  async function (req, res, next) {
    try {
      const { id } = req.params;
      const contact = await contactsService.getContactById(id);

      res.status(200).json({
        success: true,
        message: "Contact retrieved successfully",
        data: contact,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "CONTACT_NOT_FOUND",
        });
        return;
      }

      if (error.name === "CastError") {
        res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to retrieve contact",
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
  canUpdate(CONTACTS_RESOURCE),
  async function (req, res, next) {
    try {
      const { id } = req.params;

      if (!contactsService.isValidObjectId(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid contact ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
          success: false,
          message: "Request body is required for update",
          error: "EMPTY_REQUEST_BODY",
        });
        return;
      }

      const contact = await contactsService.updateContact(id, req.body);

      res.status(200).json({
        success: true,
        message: "Contact updated successfully",
        data: contact,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "CONTACT_NOT_FOUND",
        });
        return;
      }

      if (error.name === "CastError") {
        res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to update contact",
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
  canDelete(CONTACTS_RESOURCE),
  async function (req, res, next) {
    try {
      const { id } = req.params;
      const result = await contactsService.deleteContact(id);

      res.status(200).json({
        success: true,
        message: "Contact deleted successfully",
        data: result,
      });
    } catch (error) {
      if (error.name === "NotFoundError") {
        res.status(404).json({
          success: false,
          message: error.message,
          error: "CONTACT_NOT_FOUND",
        });
        return;
      }

      if (error.name === "CastError") {
        res.status(400).json({
          success: false,
          message: "Invalid ID format",
          error: "INVALID_ID_FORMAT",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete contact",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

export default router;
