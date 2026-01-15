/**
 * Formatting Middleware
 *
 * Centralized data formatting at the API boundary.
 * This middleware automatically formats incoming request data before
 * it reaches controllers and services, similar to Axios interceptors on the client.
 *
 * Single Source of Truth: Uses utils/serializers.ts
 */

import { Request, Response, NextFunction } from "express";
import { formatContactData } from "../utils/serializers.js";

/**
 * Format incoming request body data
 * Runs BEFORE controllers/services
 *
 * Automatically formats:
 * - Phone numbers → E.164 format
 * - Emails → lowercase
 * - Text fields → trimmed
 * - Dates → ISO strings
 * - ZIP codes → 5 digits
 * - States → uppercase
 */
export const formatRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only format for state-changing methods
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  // Only format if we have a body
  if (!req.body || typeof req.body !== "object") {
    return next();
  }

  try {
    const path = req.path.toLowerCase();

    // Determine which routes need contact data formatting
    const needsContactFormatting =
      path.includes("/leads") ||
      path.includes("/customers") ||
      path.includes("/quotes") ||
      path.includes("/salesorders") ||
      path.includes("/joborders");

    if (needsContactFormatting) {
      // Format contact data using centralized utility
      req.body = formatContactData(req.body);

      // Optional: Log for debugging (can be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Formatting] ${req.method} ${req.path} - Data formatted`
        );
      }
    }

    next();
  } catch (error) {
    console.error("[Formatting Error]", error);
    // Don't block the request on formatting errors
    // Let validation middleware handle any issues
    next();
  }
};
