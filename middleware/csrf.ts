import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * CSRF Token Generation and Validation Middleware
 *
 * Generates CSRF tokens for GET requests and validates them for state-changing requests
 * Tokens are stored in response headers and validated from request headers
 */

// In-memory token store (for production, consider using Redis)
const tokenStore = new Map<string, { token: string; expiresAt: number }>();

// Cleanup expired tokens every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of tokenStore.entries()) {
      if (value.expiresAt < now) {
        tokenStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Get consistent session ID from request
 * Priority: X-Session-ID header > authenticated user ID > IP > anonymous
 * This ensures the same session ID is used for both generation and validation
 */
const getSessionId = (req: Request): string => {
  // Always prioritize X-Session-ID header if present (most reliable)
  if (req.headers["x-session-id"]) {
    return req.headers["x-session-id"] as string;
  }

  // Fall back to authenticated user ID if available
  if ((req as any).user?.userId) {
    return (req as any).user.userId;
  }

  // Fall back to IP address
  if (req.ip) {
    return req.ip;
  }

  // Last resort: anonymous
  return "anonymous";
};

/**
 * Generate a CSRF token for the session
 */
export const generateCsrfToken = (req: Request, res: Response): string => {
  const sessionId = getSessionId(req);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  tokenStore.set(sessionId, { token, expiresAt });

  // Send token in response header
  res.setHeader("X-CSRF-Token", token);

  if (process.env.NODE_ENV === "development") {
    console.debug(
      `🔐 Generated CSRF token for session: ${sessionId.substring(0, 20)}...`
    );
  }

  return token;
};

/**
 * Validate CSRF token from request
 */
export const validateCsrfToken = (req: Request): boolean => {
  const sessionId = getSessionId(req);
  const tokenFromHeader = req.headers["x-csrf-token"] as string;

  const stored = tokenStore.get(sessionId);
  if (!stored) {
    console.warn("❌ CSRF token not found for session:", sessionId);
    console.warn(
      "   Available sessions:",
      Array.from(tokenStore.keys()).map((k) => k.substring(0, 20) + "...")
    );
    console.warn(
      "   Token from header:",
      tokenFromHeader ? tokenFromHeader.substring(0, 8) + "..." : "MISSING"
    );
    console.warn("   X-Session-ID header:", req.headers["x-session-id"]);
    console.warn("   req.user?.userId:", (req as any).user?.userId);
    return false;
  }

  // Check if token expired
  if (stored.expiresAt < Date.now()) {
    tokenStore.delete(sessionId);
    console.warn("❌ CSRF token expired for session:", sessionId);
    return false;
  }

  if (!tokenFromHeader) {
    console.warn(
      "❌ CSRF token missing in request header for session:",
      sessionId
    );
    return false;
  }

  const isValid = stored.token === tokenFromHeader;
  if (!isValid) {
    console.warn(
      "❌ CSRF token mismatch for session:",
      sessionId.substring(0, 20) + "...",
      {
        expected: stored.token.substring(0, 16) + "...",
        received: tokenFromHeader.substring(0, 16) + "...",
        sessionId: sessionId,
        xSessionIdHeader: req.headers["x-session-id"],
        reqUserId: (req as any).user?.userId,
      }
    );
  } else if (process.env.NODE_ENV === "development") {
    console.debug(
      "✅ CSRF token validated successfully for session:",
      sessionId.substring(0, 20) + "..."
    );
  }

  return isValid;
};

/**
 * CSRF Protection Middleware
 * Generates tokens for GET requests and validates for state-changing requests
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const isStateChanging = stateChangingMethods.includes(req.method);

  // Generate token for GET requests (all GET requests to API endpoints)
  // This ensures clients can get CSRF tokens after login
  if (req.method === "GET") {
    generateCsrfToken(req, res);
  }

  // Validate token for state-changing requests
  if (isStateChanging) {
    // Skip CSRF validation for webhook endpoints and public endpoints
    const skipPaths = [
      "/payments/webhook",
      "/leads", // Public lead submission
      "/auth", // Login/register
    ];

    const shouldSkip = skipPaths.some((path) => req.path.startsWith(path));

    if (!shouldSkip && !validateCsrfToken(req)) {
      const sessionId = getSessionId(req);
      res.status(403).json({
        success: false,
        message:
          "CSRF token validation failed. Please refresh the page and try again.",
        error: "CSRF_TOKEN_INVALID",
        ...(process.env.NODE_ENV === "development" && {
          hint: `Session ID used: ${sessionId}. Make sure you've made a GET request first to obtain a CSRF token.`,
        }),
      });
      return;
    }
  }

  next();
};

/**
 * Optional CSRF token generation endpoint
 * Allows frontend to fetch a new CSRF token
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  const token = generateCsrfToken(req, res);
  res.json({
    success: true,
    token,
  });
};
