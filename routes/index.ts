import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const router: any = Router();

/* GET home page. */
router.get("/", function (req: Request, res: Response) {
  res.status(200).send({ title: "Flush John API" });
});

/* GET health check endpoint */
router.get("/health", function (req, res) {
  try {
    const healthStatus = {
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "development",
    };

    // If database is not connected, return 503 (Service Unavailable)
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        ...healthStatus,
        success: false,
        status: "unhealthy",
        message: "Database connection failed",
      });
    }

    res.status(200).json(healthStatus);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(503).json({
      success: false,
      status: "unhealthy",
      message: "Health check failed",
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
