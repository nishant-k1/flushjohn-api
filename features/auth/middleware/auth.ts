import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import {
  isUserJwtPayload,
  UserJwtPayload,
  MongooseFilter,
} from "../../../types/common.js";

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user information to the request
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
        error: "UNAUTHORIZED",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!, {
      algorithms: ["HS256"], // Explicitly specify the algorithm
    });

    if (!isUserJwtPayload(decoded)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
        error: "INVALID_TOKEN",
      });
    }

    const user = await User.findOne({
      userId: decoded.userId,
    } as MongooseFilter<{ userId: string }>);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
        error: "ACCOUNT_DEACTIVATED",
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to too many failed login attempts.",
        error: "ACCOUNT_LOCKED",
      });
    }

    if (decoded.iat && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password was recently changed. Please log in again.",
        error: "PASSWORD_CHANGED",
      });
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
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
        error: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
        error: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Token not active yet. Please try again later.",
        error: "TOKEN_NOT_ACTIVE",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication failed due to server error.",
      error: "AUTHENTICATION_ERROR",
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't require authentication
 * If token is provided, it will be verified and user info added to request
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
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

    const user = await User.findOne({
      userId: decoded.userId,
    } as MongooseFilter<{ userId: string }>);

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
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
        error: "FORBIDDEN",
      });
    }

    next();
  };
};

/**
 * Admin-only Authorization Middleware
 * Must be used after authenticateToken middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
      error: "FORBIDDEN",
    });
  }

  next();
};

/**
 * Self or Admin Authorization Middleware
 * Allows access if user is accessing their own data or is an admin
 * Must be used after authenticateToken middleware
 */
export const selfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  const isSelf = req.user.userId === targetUserId;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
      error: "FORBIDDEN",
    });
  }

  next();
};

/**
 * Document Access Check Middleware
 * Checks if user has permission to access specific document types
 * Must be used after authenticateToken middleware
 */
export const checkDocumentAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "UNAUTHORIZED",
    });
  }

  const { documentType } = req.params;
  const userRole = req.user.role;

  const accessRules = {
    leads: ["admin", "user", "sales"],
    quotes: ["admin", "user", "sales"],
    salesOrders: ["admin", "user", "sales"],
    jobOrders: ["admin", "user", "sales"],
    customers: ["admin", "user", "sales"],
    vendors: ["admin", "user", "sales"],
    blogs: ["admin", "user"],
  };

  if (!accessRules[documentType]) {
    return res.status(400).json({
      success: false,
      message: "Invalid document type",
      error: "INVALID_DOCUMENT_TYPE",
    });
  }

  if (!accessRules[documentType].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Insufficient permissions for this document type.",
      error: "FORBIDDEN",
    });
  }

  next();
};
