/**
 * Sales Assist Routes - AI-powered sales assistance endpoints
 */

import { Router } from "express";
import * as salesAssistService from "../services/salesAssistService.js";
import { authenticateToken } from "../../auth/middleware/auth.js";

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * POST /api/sales-assist/analyze
 * Analyzes conversation transcript and provides suggestions
 */
router.post("/analyze", async (req, res) => {
  try {
    const { transcript, context } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
        error: "INVALID_REQUEST",
      });
    }

    const result = await salesAssistService.analyzeConversation(
      transcript,
      context
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze conversation",
      error: error.message,
    });
  }
});

/**
 * GET /api/sales-assist/pricing
 * Get vendor pricing based on location and event details
 */
router.get("/pricing", async (req, res) => {
  try {
    const { zipCode, city, state, eventType, quantity } = req.query;

    if (!zipCode && !city) {
      return res.status(400).json({
        success: false,
        message: "Location (zipCode or city) is required",
        error: "INVALID_REQUEST",
      });
    }

    const pricing = await salesAssistService.getVendorPricing({
      zipCode,
      city,
      state,
      eventType,
      quantity: quantity ? parseInt(quantity) : undefined,
    });

    res.status(200).json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing",
      error: error.message,
    });
  }
});

/**
 * POST /api/sales-assist/suggest-response
 * Generate a suggested response based on customer query
 */
router.post("/suggest-response", async (req, res) => {
  try {
    const { customerQuery, extractedInfo, pricing } = req.body;

    if (!customerQuery || typeof customerQuery !== "string") {
      return res.status(400).json({
        success: false,
        message: "Customer query is required",
        error: "INVALID_REQUEST",
      });
    }

    const suggestion = await salesAssistService.generateResponseSuggestion({
      customerQuery,
      extractedInfo,
      pricing,
    });

    res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error("Error generating response suggestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate response suggestion",
      error: error.message,
    });
  }
});

/**
 * POST /api/sales-assist/vendor-call-suggestions
 * Generate vendor call suggestions based on lead data
 */
router.post("/vendor-call-suggestions", async (req, res) => {
  try {
    const { leadId } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
        error: "INVALID_REQUEST",
      });
    }

    const suggestions = await salesAssistService.generateVendorCallSuggestions(
      leadId
    );

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Error generating vendor call suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate vendor call suggestions",
      error: error.message,
    });
  }
});

/**
 * POST /api/sales-assist/submit-vendor-quote
 * Submit actual vendor quote to improve pricing accuracy
 */
router.post("/submit-vendor-quote", async (req, res) => {
  try {
    const {
      vendorId,
      vendorName,
      zipCode,
      city,
      state,
      eventType,
      quantity,
      pricePerUnit,
      totalPrice,
      additionalCharges,
      quotedBy,
      notes,
      source,
      aiSuggestedPrice, // Optional: compare with AI suggestion
    } = req.body;

    if (!vendorId && !vendorName) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID or name is required",
        error: "INVALID_REQUEST",
      });
    }

    if (!quantity || !pricePerUnit || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Quantity, price per unit, and total price are required",
        error: "INVALID_REQUEST",
      });
    }

    const quote = await salesAssistService.submitVendorQuote({
      vendorId,
      vendorName,
      zipCode,
      city,
      state,
      eventType,
      quantity,
      pricePerUnit,
      totalPrice,
      additionalCharges: additionalCharges || 0,
      quotedBy,
      notes,
      source: source || "manual_call",
      aiSuggestedPrice,
    });

    res.status(201).json({
      success: true,
      data: quote,
      message:
        "Vendor quote saved successfully. Pricing accuracy will improve.",
    });
  } catch (error) {
    console.error("Error submitting vendor quote:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit vendor quote",
      error: error.message,
    });
  }
});

export default router;
