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
    .custom((value) => {
      // Accept international phone numbers in E.164 format (+[country code][number])
      // Example: +919002785699, +12423432432, +442071234567
      
      // Remove all whitespace for validation
      const normalized = value.replace(/\s/g, "");
      
      // Check if it starts with + (E.164 format)
      if (normalized.startsWith("+")) {
        // Extract digits only (remove +, spaces, dashes, parentheses)
        const digits = normalized.replace(/\D/g, "");
        // Valid international number should have 7-15 digits (ITU-T E.164 standard)
        if (digits.length >= 7 && digits.length <= 15) {
          return true;
        }
        throw new Error(
          "Phone number must be in international format with 7-15 digits (e.g., +919002785699)"
        );
      }
      
      // Fallback: Accept US phone numbers without + prefix
      const digits = normalized.replace(/\D/g, "");
      if (
        digits.length === 10 ||
        (digits.length === 11 && digits.startsWith("1"))
      ) {
        return true;
      }
      
      throw new Error(
        "Phone number must be in international format starting with + (e.g., +919002785699) or a valid US phone number (10 digits)"
      );
    }),

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
    .isIn(["Event", "Construction", "Emergency", "Renovation", "Other"])
    .withMessage("Please select a valid usage type"),

  body("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

  body("leadStatus")
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (!value) return true; // Optional field, skip if empty
      // Normalize to Title Case for consistent validation
      const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      const validValues = ["None", "Won", "Lost"];
      if (validValues.includes(normalized)) {
        // Update the request body with normalized value for consistent storage
        req.body.leadStatus = normalized;
        return true;
      }
      throw new Error("Please select a valid lead status");
    }),

  body("assignedTo")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Assigned to must be less than 100 characters"),
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
    .custom((value) => {
      if (!value) return true; // Optional field, skip if empty
      // Normalize: remove all non-digit characters
      const digits = value.replace(/\D/g, "");
      // Validate: must have 10 digits, or 11 digits starting with 1
      if (
        digits.length === 10 ||
        (digits.length === 11 && digits.startsWith("1"))
      ) {
        return true;
      }
      throw new Error(
        "Phone number must be 10 digits (or 11 digits starting with 1)"
      );
    }),

  body("zip")
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Please provide a valid US ZIP code"),

  body("usageType")
    .optional()
    .trim()
    .isIn(["Event", "Construction", "Emergency", "Renovation", "Other"])
    .withMessage("Please select a valid usage type"),

  body("leadStatus")
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (!value) return true; // Optional field, skip if empty
      // Normalize to Title Case for consistent validation
      const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      const validValues = ["None", "Won", "Lost"];
      if (validValues.includes(normalized)) {
        // Update the request body with normalized value for consistent storage
        req.body.leadStatus = normalized;
        return true;
      }
      throw new Error("Please select a valid lead status");
    }),
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
    .isIn([
      "createdAt",
      "leadNo",
      "leadStatus",
      "assignedTo",
      "leadSource",
      "fName",
      "lName",
      "email",
      "phone",
      "deliveryDate",
      "pickupDate",
      "zip",
      "city",
      "state",
      "cName",
    ])
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
      details: errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};
