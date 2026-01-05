/**
 * Middleware to validate and recalculate product amounts
 * Ensures financial accuracy by server-side verification
 */

import { Request, Response, NextFunction } from "express";
import { getCurrentDateTime } from "../lib/dayjs.js";

interface Product {
  item?: string;
  qty?: number | string;
  rate?: number | string;
  amount?: number | string;
  usageType?: string;
  [key: string]: any;
}

const validateAndRecalculateProducts = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { products } = req.body as { products?: Product[] };

    // If no products, continue
    if (!products || !Array.isArray(products) || products.length === 0) {
      return next();
    }

    let hasDiscrepancy = false;
    const discrepancies: Array<{
      index: number;
      item: string;
      qty: number;
      rate: number;
      frontendAmount: number;
      serverAmount: number;
      difference: number;
    }> = [];

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
          item: product.item || "",
          qty,
          rate,
          frontendAmount: frontendAmountRounded,
          serverAmount: serverAmountRounded,
          difference,
        });
      }

      // Return product with server-calculated amount
      // Explicitly preserve all product fields including usageType
      return {
        ...product,
        qty,
        rate,
        amount: serverAmountRounded,
        usageType: product.usageType || "", // Explicitly preserve usageType
      };
    });

    // Log discrepancies for audit trail
    if (hasDiscrepancy) {
      // Product validation discrepancies detected
    }

    // Replace products with validated version
    req.body.products = validatedProducts;

    // Add calculation summary to request for logging
    req.productValidation = {
      hasDiscrepancy,
      discrepancies,
      productCount: validatedProducts.length,
      totalAmount: validatedProducts
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        .toFixed(2),
    };

    next();
  } catch (error: any) {
    // Product validation error
    res.status(500).json({
      success: false,
      message: "Failed to validate product calculations",
      error: "VALIDATION_ERROR",
      details: error.message,
    });
    return;
  }
};

export default validateAndRecalculateProducts;
