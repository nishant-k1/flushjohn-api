/**
 * Phone Routes - HTTP Request Handling Layer
 */

import { Router } from "express";
import * as phoneService from "../services/phoneService.js";
import { authenticateToken } from "../../auth/middleware/auth.js";
import { canRead } from "../../auth/middleware/permissions.js";
import { RESOURCES } from "../../auth/middleware/permissions.js";
import { body, validationResult } from "express-validator";

const router: any = Router();

/**
 * POST /phone/call
 * Initiate a phone call via phone.com API
 */
router.post(
  "/call",
  authenticateToken,
  canRead(RESOURCES.LEADS), // Using LEADS permission as calls are typically made from leads
  [
    body("phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .isString()
      .withMessage("Phone number must be a string"),
  ],
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { phoneNumber } = req.body;

      const result = await phoneService.initiateCall(phoneNumber);

      res.json({
        success: result.success,
        method: result.method,
        phoneNumber: result.phoneNumber,
        telLink: result.telLink,
        data: result.data,
      });
    } catch (error) {
      console.error("Error initiating phone call:", error);
      next(error);
    }
  }
);

export default router;

