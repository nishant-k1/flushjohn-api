/**
 * Leads Routes - HTTP Request Handling Layer
 *
 * This layer handles HTTP requests/responses only.
 * All business logic is delegated to the service layer.
 */

import { Router } from "express";
import * as leadsService from "../services/leadsService.js";
import alertService from "../../../services/alertService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";
import { authenticateToken } from "../../auth/middleware/auth.js";

const router = Router();

// POST /leads - Create a new lead
router.post(
  "/",
  authenticateToken,
  validateAndRecalculateProducts,
  async function (req, res, next) {
    try {
      // Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
          error: "EMPTY_REQUEST_BODY",
        });
      }

      const lead = await leadsService.createLead(req.body);

      // Emit Socket.IO event for real-time notifications
      if (global.leadsNamespace) {
        try {
          // Get updated leads list and emit to all connected clients
          const { default: Leads } = await import("../models/lead.js");
          const leadsList = await Leads.find().sort({ _id: -1 });
          global.leadsNamespace.emit("leadCreated", leadsList);

          // HTTP API - Emitted leadCreated event to Socket.IO clients
        } catch (emitError) {
          // Error emitting leadCreated event
        }
      }

      res.status(201).json({
        success: true,
        message: "Lead created successfully",
        data: lead,
      });
    } catch (error) {
      // Handle specific error types
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

// GET /leads - Get all leads with pagination, sorting, and filtering
router.get("/", authenticateToken, async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const { status, assignedTo, leadSource, search } = req.query;

    // Validate pagination parameters
    const validationErrors = leadsService.validatePaginationParams(page, limit);
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

    res.status(500).json({
      success: false,
      message: "Failed to retrieve leads",
      error: "INTERNAL_SERVER_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// GET /leads/:id - Get a single lead by ID
router.get("/:id", authenticateToken, async function (req, res, next) {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!leadsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

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
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

// PUT /leads/:id - Update a lead by ID
router.put(
  "/:id",
  authenticateToken,
  validateAndRecalculateProducts,
  async function (req, res, next) {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!leadsService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID format",
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
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

// PUT /leads/update/:id - Update a lead by ID (alternative route to bypass CORS cache)
router.put(
  "/update/:id",
  authenticateToken,
  validateAndRecalculateProducts,
  async function (req, res, next) {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!leadsService.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID format",
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
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

// DELETE /leads/:id - Delete a lead by ID
router.delete("/:id", authenticateToken, async function (req, res, next) {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!leadsService.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID format",
        error: "INVALID_ID_FORMAT",
      });
    }

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

// POST /leads/test-alerts - Test Telegram alerts endpoint
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

// GET /leads/whatsapp-qr - WhatsApp QR Code web endpoint
router.get("/whatsapp-qr", async function (req, res, next) {
  try {
    const qrData = alertService.getWhatsAppQRCode();

    if (!qrData.isEnabled) {
      return res.status(400).send(`
        <html>
          <head><title>WhatsApp QR Code</title></head>
          <body>
            <h1>WhatsApp Alerts Disabled</h1>
            <p>WhatsApp alerts are not enabled. Please set WHATSAPP_ENABLED=true in your environment variables.</p>
          </body>
        </html>
      `);
    }

    if (!qrData.hasQRCode) {
      return res.status(200).send(`
        <html>
          <head>
            <title>WhatsApp QR Code</title>
            <meta http-equiv="refresh" content="5">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .status { color: #666; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>WhatsApp Authentication</h1>
            <div class="status">
              ${
                qrData.isReady
                  ? '<p style="color: green;">✅ WhatsApp is authenticated and ready!</p>'
                  : "<p>⏳ Waiting for QR code generation...</p>"
              }
            </div>
            <p>This page will refresh automatically every 5 seconds.</p>
          </body>
        </html>
      `);
    }

    // Display QR code
    res.status(200).send(`
      <html>
        <head>
          <title>WhatsApp QR Code</title>
          <meta http-equiv="refresh" content="30">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
              margin: 0 auto;
            }
            .qr-code {
              margin: 20px 0;
              border: 2px solid #ddd;
              border-radius: 10px;
              padding: 20px;
              background: white;
            }
            .instructions {
              color: #666;
              margin: 20px 0;
              line-height: 1.6;
            }
            .status {
              color: #25D366;
              font-weight: bold;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 WhatsApp QR Code</h1>
            <div class="status">Ready for scanning</div>
            
            <div class="qr-code">
              <img src="${qrData.qrCodeImage}" alt="WhatsApp QR Code" style="max-width: 100%; height: auto;">
            </div>
            
            <div class="instructions">
              <h3>How to scan:</h3>
              <ol style="text-align: left; display: inline-block;">
                <li>Open WhatsApp on your phone</li>
                <li>Go to Settings → Linked Devices</li>
                <li>Tap "Link a Device"</li>
                <li>Scan this QR code</li>
              </ol>
            </div>
            
            <p><small>This page refreshes every 30 seconds. After authentication, this QR code will disappear.</small></p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {


    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>Failed to display WhatsApp QR code: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

export default router;
