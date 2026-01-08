import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { isUserJwtPayload } from "../../../types/common.js";

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user information to the request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;

    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
        error: "UNAUTHORIZED",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!, {
      algorithms: ["HS256"], // Explicitly specify the algorithm
    });

    if (!isUserJwtPayload(decoded)) {
      res.status(401).json({
        success: false,
        message: "Invalid token format",
        error: "INVALID_TOKEN",
      });
      return;
    }

    const user = await (User as any).findOne({
      userId: decoded.userId,
    } as any);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
        error: "ACCOUNT_DEACTIVATED",
      });
      return;
    }

    if (user.isLocked()) {
      res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to too many failed login attempts.",
        error: "ACCOUNT_LOCKED",
      });
      return;
    }

    if (decoded.iat && user.changedPasswordAfter(decoded.iat)) {
      res.status(401).json({
        success: false,
        message: "Password was recently changed. Please log in again.",
        error: "PASSWORD_CHANGED",
      });
      return;
    }

    req.user = {
      id: user._id,
      userId: user.userId,
      email: user.email,
      fName: user.fName,
      lName: user.lName,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
        error: "INVALID_TOKEN",
      });
      return;
    }

    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
        error: "TOKEN_EXPIRED",
      });
      return;
    }

    if (error.name === "NotBeforeError") {
      res.status(401).json({
        success: false,
        message: "Token not active yet. Please try again later.",
        error: "TOKEN_NOT_ACTIVE",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Authentication failed due to server error.",
      error: "AUTHENTICATION_ERROR",
    });
    return;
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't require authentication
 * If token is provided, it will be verified and user info added to request
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;

    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!, {
      algorithms: ["HS256"], // Explicitly specify the algorithm
    });

    if (!isUserJwtPayload(decoded)) {
      return next();
    }

    const user = await (User as any).findOne({
      userId: decoded.userId,
    } as any);

    if (user && user.isActive && !user.isLocked()) {
      req.user = {
        id: user._id,
        userId: user.userId,
        email: user.email,
        fName: user.fName,
        lName: user.lName,
        role: user.role,
        isActive: user.isActive,
      };
    }

    next();
  } catch {
    next();
  }
};

/**
 * Role-based Authorization Middleware
 * Must be used after authenticateToken middleware
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        error: "FORBIDDEN",
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only Authorization Middleware
 * Must be used after authenticateToken middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
      error: "FORBIDDEN",
    });
    return;
  }

  next();
};

/**
 * Self or Admin Authorization Middleware
 * Allows access if user is accessing their own data or is an admin
 * Must be used after authenticateToken middleware
 */
export const selfOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
    return;
  }

  const targetUserId = req.params.userId || req.params.id;
  const isSelf = req.user.userId === targetUserId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
      error: "FORBIDDEN",
    });
    return;
  }

  next();
};

/**
 * Document Access Check Middleware
 * Checks if user has permission to access specific document types
 * Must be used after authenticateToken middleware
 */
export const checkDocumentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
    return;
  }

  const { documentType } = req.params;
  const userRole = req.user.role;

  const accessRules: Record<string, string[]> = {
    leads: ["admin", "user", "sales"],
    quotes: ["admin", "user", "sales"],
    salesOrders: ["admin", "user", "sales"],
    jobOrders: ["admin", "user", "sales"],
    customers: ["admin", "user", "sales"],
    vendors: ["admin", "user", "sales"],
    blogs: ["admin", "user"],
  };

  if (!accessRules[documentType]) {
    res.status(400).json({
      success: false,
      message: "Invalid document type",
      error: "INVALID_DOCUMENT_TYPE",
    });
    return;
  }

  if (!accessRules[documentType].includes(userRole)) {
    res.status(403).json({
      success: false,
      message:
        "Access denied. Insufficient permissions for this document type.",
      error: "FORBIDDEN",
    });
    return;
  }

  next();
};
