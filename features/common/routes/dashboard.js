import express from "express";
import { getDashboardAnalytics } from "../services/dashboardService.js";

const router = express.Router();

/**
 * GET /dashboard/analytics - Get comprehensive dashboard analytics
 */
router.get("/analytics", async (req, res) => {
  try {
    const { dateRange, month, year } = req.query;
    const yearNumber = year ? parseInt(year, 10) : null;
    const analytics = await getDashboardAnalytics(dateRange, month, yearNumber);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message,
    });
  }
});

export default router;
