/**
 * Blog Automation API Routes
 * Provides endpoints for monitoring and controlling automated blog generation
 */

import express from "express";
import {
  getCronJobStatus,
  triggerJob,
  testCronSystem,
} from "../services/cronScheduler.js";
import {
  getAutomationStats,
  runAutomatedBlogGeneration,
} from "../services/automatedBlogService.js";
import { getCalendarStats } from "../services/contentCalendar.js";

const router = express.Router();

/**
 * GET /blog-automation/status
 * Get current automation system status
 */
router.get("/status", async (req, res) => {
  try {
    const cronStatus = getCronJobStatus();
    const automationStats = await getAutomationStats();
    const calendarStats = getCalendarStats();

    res.json({
      success: true,
      data: {
        cronJobs: cronStatus,
        automation: automationStats,
        calendar: calendarStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get automation status",
      error: error.message,
    });
  }
});

/**
 * GET /blog-automation/stats
 * Get detailed automation statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await getAutomationStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get automation stats",
      error: error.message,
    });
  }
});

/**
 * POST /blog-automation/trigger
 * Manually trigger a specific job
 */
router.post("/trigger", async (req, res) => {
  try {
    const { jobName } = req.body;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        message: "Job name is required",
      });
    }

    const validJobs = [
      "weeklyBlogGeneration",
      "midWeekBlogGeneration", 
      "weeklyProblemSolving",
      "dailyStatusCheck",
      "healthCheck",
    ];
    if (!validJobs.includes(jobName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid job name. Must be one of: ${validJobs.join(", ")}`,
      });
    }

    await triggerJob(jobName);

    res.json({
      success: true,
      message: `Job ${jobName} triggered successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to trigger job",
      error: error.message,
    });
  }
});

/**
 * POST /blog-automation/generate-blog
 * Manually trigger blog generation (for testing)
 */
router.post("/generate-blog", async (req, res) => {
  try {
    const { contentType } = req.body; // 'construction', 'city', 'problemSolving', or null
    // Use randomization for manual generation to avoid duplicates
    const result = await runAutomatedBlogGeneration(contentType, true);

    if (result.success) {
      res.json({
        success: true,
        message: "Blog post generated and published successfully",
        data: {
          blogPost: result.blogPost,
          duration: result.duration,
          timestamp: result.timestamp,
          contentType: contentType || "default",
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Blog generation failed",
        error: result.error,
        duration: result.duration,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate blog post",
      error: error.message,
    });
  }
});

/**
 * POST /blog-automation/test
 * Test the automation system
 */
router.post("/test", async (req, res) => {
  try {
    const testResult = await testCronSystem();

    res.json({
      success: testResult,
      message: testResult
        ? "All automation tests passed"
        : "Some automation tests failed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Automation test failed",
      error: error.message,
    });
  }
});

/**
 * GET /blog-automation/calendar
 * Get content calendar information
 */
router.get("/calendar", (req, res) => {
  try {
    const stats = getCalendarStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get calendar stats",
      error: error.message,
    });
  }
});

export default router;
