/**
 * Quote Validation Rules
 */

import { body, param, query, validationResult } from "express-validator";

export const validateCreateQuote = [
  body("fName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),

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
    .withMessage("Phone number contains invalid characters"),

  body("zip")
    .trim()
    .notEmpty()
    .withMessage("ZIP code is required")
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Please provide a valid US ZIP code"),

  body("usageType")
    .trim()
    .notEmpty()
    .withMessage("Usage type is required")
    .isIn(["Event", "Construction", "Emergency", "Other"])
    .withMessage("Please select a valid usage type"),

  body("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

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
];

export const validateUpdateQuote = [
  param("id")
    .notEmpty()
    .withMessage("Quote ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid quote ID format"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("usageType")
    .optional()
    .trim()
    .isIn(["Event", "Construction", "Emergency", "Other"])
    .withMessage("Please select a valid usage type"),
];

export const validateQuoteId = [
  param("id")
    .notEmpty()
    .withMessage("Quote ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid quote ID format"),
];

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
