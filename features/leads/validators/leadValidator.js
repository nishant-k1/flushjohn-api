/**
 * Lead Validation Rules
 * Using express-validator for comprehensive input validation
 */

import { body, param, query, validationResult } from "express-validator";

/**
 * Validate lead creation
 */
export const validateCreateLead = [
  body("fName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),

  body("lName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name must be less than 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\d\s\-()]+$/)
    .withMessage("Phone number contains invalid characters")
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),

  body("zip")
    .trim()
    .notEmpty()
    .withMessage("ZIP code is required")
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Please provide a valid US ZIP code"),

  body("deliveryDate")
    .notEmpty()
    .withMessage("Delivery date is required")
    .isISO8601()
    .withMessage("Please provide a valid delivery date"),

  body("pickupDate")
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Please provide a valid pickup date"),

  body("usageType")
    .trim()
    .notEmpty()
    .withMessage("Usage type is required")
    .isIn(["Event", "Construction", "Emergency", "Other"])
    .withMessage("Please select a valid usage type"),

  body("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

  body("leadStatus")
    .optional()
    .trim()
    .isIn(["New", "Contacted", "Qualified", "Lost", "None"])
    .withMessage("Please select a valid lead status"),

  body("assignedTo")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Assigned to must be a valid email address"),
];

/**
 * Validate lead update
 */
export const validateUpdateLead = [
  param("id")
    .notEmpty()
    .withMessage("Lead ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid lead ID format"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^[\d\s\-()]+$/)
    .withMessage("Phone number contains invalid characters"),

  body("zip")
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Please provide a valid US ZIP code"),

  body("usageType")
    .optional()
    .trim()
    .isIn(["Event", "Construction", "Emergency", "Other"])
    .withMessage("Please select a valid usage type"),

  body("leadStatus")
    .optional()
    .trim()
    .isIn(["New", "Contacted", "Qualified", "Lost", "None"])
    .withMessage("Please select a valid lead status"),
];

/**
 * Validate lead ID parameter
 */
export const validateLeadId = [
  param("id")
    .notEmpty()
    .withMessage("Lead ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid lead ID format"),
];

/**
 * Validate pagination parameters
 */
export const validateGetLeads = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "leadNo", "leadStatus", "assignedTo"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be 'asc' or 'desc'"),
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      error: "VALIDATION_ERROR",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};
