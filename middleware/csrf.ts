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
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a CSRF token for the session
 */
export const generateCsrfToken = (req: Request, res: Response): string => {
  const sessionId = req.headers["x-session-id"] || 
                    (req as any).user?.userId || 
                    req.ip || 
                    "anonymous";
  
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  tokenStore.set(sessionId, { token, expiresAt });
  
  // Send token in response header
  res.setHeader("X-CSRF-Token", token);
  
  return token;
};

/**
 * Validate CSRF token from request
 */
export const validateCsrfToken = (req: Request): boolean => {
  const sessionId = req.headers["x-session-id"] || 
                    (req as any).user?.userId || 
                    req.ip || 
                    "anonymous";
  
  const stored = tokenStore.get(sessionId);
  if (!stored) {
    return false;
  }
  
  // Check if token expired
  if (stored.expiresAt < Date.now()) {
    tokenStore.delete(sessionId);
    return false;
  }
  
  const tokenFromHeader = req.headers["x-csrf-token"] as string;
  if (!tokenFromHeader) {
    return false;
  }
  
  return stored.token === tokenFromHeader;
};

/**
 * CSRF Protection Middleware
 * Generates tokens for GET requests and validates for state-changing requests
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  const isStateChanging = stateChangingMethods.includes(req.method);
  
  // Generate token for GET requests
  if (req.method === "GET" && !req.path.startsWith("/api")) {
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
    
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
    
    if (!shouldSkip && !validateCsrfToken(req)) {
      res.status(403).json({
        success: false,
        message: "CSRF token validation failed",
        error: "CSRF_TOKEN_INVALID",
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

