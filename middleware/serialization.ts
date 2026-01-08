/**
 * Serialization Middleware
 *
 * Centralized data serialization/normalization at the API boundary.
 * This middleware automatically serializes incoming request data before
 * it reaches controllers and services, similar to Axios interceptors on the client.
 *
 * Single Source of Truth: Uses utils/serializers.ts
 */

import { Request, Response, NextFunction } from "express";
import { serializeContactData } from "../utils/serializers.js";

/**
 * Serialize incoming request body data
 * Runs BEFORE controllers/services
 *
 * Automatically normalizes:
 * - Phone numbers → E.164 format
 * - Emails → lowercase
 * - Text fields → trimmed
 * - Dates → ISO strings
 * - ZIP codes → 5 digits
 * - States → uppercase
 */
export const serializeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only serialize for state-changing methods
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  // Only serialize if we have a body
  if (!req.body || typeof req.body !== "object") {
    return next();
  }

  try {
    const path = req.path.toLowerCase();

    // Determine which routes need contact data serialization
    const needsContactSerialization =
      path.includes("/leads") ||
      path.includes("/customers") ||
      path.includes("/quotes") ||
      path.includes("/salesorders") ||
      path.includes("/joborders");

    if (needsContactSerialization) {
      // Serialize contact data using centralized utility
      req.body = serializeContactData(req.body);

      // Optional: Log for debugging (can be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Serialization] ${req.method} ${req.path} - Data serialized`
        );
      }
    }

    next();
  } catch (error) {
    console.error("[Serialization Error]", error);
    // Don't block the request on serialization errors
    // Let validation middleware handle any issues
    next();
  }
};

/**
 * Format outgoing response data (optional)
 * Runs AFTER controllers/services
 *
 * Note: Response formatting is typically handled in controllers.
 * This middleware is kept for potential future use but is not critical.
 */
export const serializeResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Responses are already properly formatted by controllers
  // No transformation needed at middleware level
  next();
};
