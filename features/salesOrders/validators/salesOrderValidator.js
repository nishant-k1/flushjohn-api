/**
 * Sales Order Validation Rules
 */

import { body, param, validationResult } from "express-validator";

export const validateCreateSalesOrder = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("quoteNo")
    .notEmpty()
    .withMessage("Quote number is required")
    .isInt({ min: 1 })
    .withMessage("Quote number must be a positive integer"),

  body("fName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .custom((value) => {
      // Normalize: remove all non-digit characters
      const digits = value.replace(/\D/g, "");
      // Validate: must have 10 digits, or 11 digits starting with 1
      if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
        return true;
      }
      throw new Error("Phone number must be 10 digits (or 11 digits starting with 1)");
    }),

  body("streetAddress")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Street address is too long"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City name is too long"),

  body("state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State name is too long"),

  body("zip")
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage("Please provide a valid US ZIP code"),

  body("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),
];

export const validateUpdateSalesOrder = [
  param("id")
    .notEmpty()
    .withMessage("Sales Order ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid sales order ID format"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const validateSalesOrderId = [
  param("id")
    .notEmpty()
    .withMessage("Sales Order ID is required")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid sales order ID format"),
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
