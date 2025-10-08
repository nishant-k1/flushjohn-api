import jwt from "jsonwebtoken";
import User from "../models/User/index.js";

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user information to the request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;

    let token = null;

    // Try Authorization header first (Bearer token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // Try query parameter
    else if (queryToken) {
      token = queryToken;
    }
    // Try cookie (for web app compatibility)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
        error: "UNAUTHORIZED",
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Get user details from database
    const user = await User.findOne({ userId: decoded.userId });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
        error: "ACCOUNT_DEACTIVATED",
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message:
          "Account is temporarily locked due to too many failed login attempts.",
        error: "ACCOUNT_LOCKED",
      });
    }

    // Check if password was changed after JWT was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "Password was recently changed. Please log in again.",
        error: "PASSWORD_CHANGED",
      });
    }

    // Add user information to request object
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
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
        error: "TOKEN_EXPIRED",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        error: "FORBIDDEN",
      });
    }

    next();
  };
};

/**
 * Check if user has access to specific document
 * @param {string} documentType - Type of document (quote, salesOrder, jobOrder)
 * @param {string} documentId - Document ID
 */
export const checkDocumentAccess = async (req, res, next) => {
  try {
    const { documentType, documentId } = req.params;

    // Admin users have access to all documents
    if (req.user.role === "admin") {
      return next();
    }

    // For now, allow all authenticated users to access documents
    // You can implement more granular access control here based on your business logic
    // For example:
    // - Check if user created the document
    // - Check if user is assigned to the document
    // - Check if user's role allows access to this document type

    // Example implementation for document ownership:
    /*
    let document;
    switch (documentType) {
      case 'quote':
        document = await Quotes.findById(documentId);
        break;
      case 'salesOrder':
        document = await SalesOrders.findById(documentId);
        break;
      case 'jobOrder':
        document = await JobOrders.findById(documentId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid document type",
          error: "INVALID_DOCUMENT_TYPE"
        });
    }
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        error: "DOCUMENT_NOT_FOUND"
      });
    }
    
    // Check if user has access to this document
    if (document.createdBy !== req.user.id && document.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this document",
        error: "ACCESS_DENIED"
      });
    }
    */

    next();
  } catch (error) {
    console.error("Document access check error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking document access",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
};
