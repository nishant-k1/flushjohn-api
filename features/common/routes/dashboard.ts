import express from "express";
import { calculateRevenue } from "../services/revenueService.js";

const router = express.Router();

/**
 * POST /dashboard/revenue/calculate - Calculate revenue for a date range
 * All calculation logic happens on the backend
 */
router.post("/revenue/calculate", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      vendorTransactionCharges = 0,
      vendorTransactionChargesMode = "percentage",
      googleAdsSpending = 0,
      facebookAdsSpending = 0,
      instagramAdsSpending = 0,
      linkedInAdsSpending = 0,
      othersExpenses = 0,
    } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
      return;
    }

    const result = await calculateRevenue({
      startDate,
      endDate,
      vendorTransactionCharges: parseFloat(vendorTransactionCharges || 0),
      vendorTransactionChargesMode,
      googleAdsSpending: parseFloat(googleAdsSpending || 0),
      facebookAdsSpending: parseFloat(facebookAdsSpending || 0),
      instagramAdsSpending: parseFloat(instagramAdsSpending || 0),
      linkedInAdsSpending: parseFloat(linkedInAdsSpending || 0),
      othersExpenses: parseFloat(othersExpenses || 0),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate revenue",
      error: error.message,
    });
  }
});

export default router;
