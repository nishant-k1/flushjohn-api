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

/* GET health check for email configuration */
router.get("/health/email-config", function (req, res) {
  try {
    // Check email configuration
    const emailConfig = {
      FLUSH_JOHN_EMAIL_ID: !!process.env.FLUSH_JOHN_EMAIL_ID,
      FLUSH_JOHN_EMAIL_PASSWORD: !!process.env.FLUSH_JOHN_EMAIL_PASSWORD,
      FLUSH_JOHN_COMPANY_NAME: !!process.env.FLUSH_JOHN_COMPANY_NAME,
    };

    // Check AWS/S3 configuration
    const awsConfig = {
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_BUCKET_NAME: !!process.env.AWS_S3_BUCKET_NAME,
      AWS_REGION: !!process.env.AWS_REGION,
    };

    // Optional configurations
    const optionalConfig = {
      CLOUDFRONT_URL: !!process.env.CLOUDFRONT_URL,
      FLUSH_JOHN_PHONE: !!process.env.FLUSH_JOHN_PHONE,
      FLUSH_JOHN_PHONE_LINK: !!process.env.FLUSH_JOHN_PHONE_LINK,
      FLUSH_JOHN_HOMEPAGE: !!process.env.FLUSH_JOHN_HOMEPAGE,
    };

    // Find missing required variables
    const missingEmail = Object.entries(emailConfig)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key);

    const missingAWS = Object.entries(awsConfig)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key);

    const allMissing = [...missingEmail, ...missingAWS];

    if (allMissing.length > 0) {
      return res.status(500).json({
        success: false,
        message: "Missing required environment variables for quote email functionality",
        missing: allMissing,
        emailConfig: emailConfig,
        awsConfig: awsConfig,
        optionalConfig: optionalConfig,
      });
    }

    res.status(200).json({
      success: true,
      message: "All required environment variables for quote email are configured",
      emailConfig: emailConfig,
      awsConfig: awsConfig,
      optionalConfig: optionalConfig,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Failed to check email configuration",
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
