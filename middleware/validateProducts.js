/**
 * Middleware to validate and recalculate product amounts
 * Ensures financial accuracy by server-side verification
 */

import { getCurrentDateTime } from "../lib/dayjs/index.js";

const validateAndRecalculateProducts = (req, res, next) => {
  try {
    const { products } = req.body;

    // If no products, continue
    if (!products || !Array.isArray(products) || products.length === 0) {
      return next();
    }

    let hasDiscrepancy = false;
    const discrepancies = [];

    // Recalculate and validate each product
    const validatedProducts = products.map((product, index) => {
      const qty = Number(product.qty) || 0;
      const rate = Number(product.rate) || 0;
      const frontendAmount = Number(product.amount) || 0;

      // Calculate correct amount (server-side source of truth)
      const serverAmount = qty * rate;

      // Round to 2 decimal places for comparison
      const serverAmountRounded = Math.round(serverAmount * 100) / 100;
      const frontendAmountRounded = Math.round(frontendAmount * 100) / 100;

      // Check for discrepancy (allow 0.01 tolerance for floating point errors)
      const difference = Math.abs(serverAmountRounded - frontendAmountRounded);
      if (difference > 0.01) {
        hasDiscrepancy = true;
        discrepancies.push({
          index,
          item: product.item,
          qty,
          rate,
          frontendAmount: frontendAmountRounded,
          serverAmount: serverAmountRounded,
          difference,
        });
      }

      // Return product with server-calculated amount
      return {
        ...product,
        qty,
        rate,
        amount: serverAmountRounded,
      };
    });

    // Log discrepancies for audit trail
    if (hasDiscrepancy) {

        endpoint: req.originalUrl,
        method: req.method,
        timestamp: getCurrentDateTime().toISOString(),
        discrepancies,
      });
    }

    // Replace products with validated version
    req.body.products = validatedProducts;

    // Add calculation summary to request for logging
    req.productValidation = {
      hasDiscrepancy,
      discrepancies,
      productCount: validatedProducts.length,
      totalAmount: validatedProducts
        .reduce((sum, p) => sum + p.amount, 0)
        .toFixed(2),
    };

    next();
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to validate product calculations",
      error: "VALIDATION_ERROR",
      details: error.message,
    });
  }
};

export default validateAndRecalculateProducts;
