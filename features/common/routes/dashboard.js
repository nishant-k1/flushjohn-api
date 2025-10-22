import express from "express";
import { getDashboardAnalytics } from "../services/dashboardService.js";

const router = express.Router();

/**
 * GET /dashboard/analytics - Get comprehensive dashboard analytics
 */
router.get("/analytics", async (req, res) => {
  try {
    const { dateRange, month, year } = req.query;
    const analytics = await getDashboardAnalytics(dateRange, month, year);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message,
    });
  }
});

export default router;
