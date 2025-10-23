/**
 * Cron Job Scheduler for Automated Blog Generation
 * Manages weekly blog post generation and publishing
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", "..", ".env") });

import cron from "node-cron";
import {
  runAutomatedBlogGeneration,
  getAutomationStats,
} from "./automatedBlogService.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

const CRON_CONFIG = {
  weeklyBlogGeneration: "0 9 * * 1",
  midWeekBlogGeneration: "0 10 * * 3",
  weeklyProblemSolving: "0 11 * * 5",
  dailyStatusCheck: "0 8 * * *",
  healthCheck: "0 */6 * * *",
};

let jobStatus = {
  weeklyBlogGeneration: {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  },
  midWeekBlogGeneration: {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  },
  weeklyProblemSolving: {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  },
  dailyStatusCheck: {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  },
  healthCheck: {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
  },
};

/**
 * Monday - Construction-focused blog generation job
 */
async function weeklyBlogGenerationJob() {
  const jobName = "weeklyBlogGeneration";
  const startTime = new Date();

  console.log(
    `\n🏗️ Starting Monday construction blog generation job at ${startTime.toISOString()}`
  );

  jobStatus[jobName].isRunning = true;
  jobStatus[jobName].lastRun = startTime;
  jobStatus[jobName].totalRuns++;

  try {
    const result = await runAutomatedBlogGeneration("construction");

    if (result.success) {
      jobStatus[jobName].lastSuccess = new Date();
      jobStatus[jobName].successfulRuns++;
      console.log(
        `✅ Monday construction blog generation completed successfully`
      );
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    jobStatus[jobName].lastError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
    };
    jobStatus[jobName].failedRuns++;
    console.error(
      `❌ Monday construction blog generation failed:`,
      error.message
    );
  } finally {
    jobStatus[jobName].isRunning = false;
    const duration = new Date() - startTime;
    console.log(
      `⏱️  Monday construction blog generation job completed in ${duration}ms`
    );
  }
}

/**
 * Wednesday - City-specific blog generation job
 */
async function midWeekBlogGenerationJob() {
  const jobName = "midWeekBlogGeneration";
  const startTime = new Date();

  console.log(
    `\n🏙️ Starting Wednesday city-specific blog generation job at ${startTime.toISOString()}`
  );

  jobStatus[jobName].isRunning = true;
  jobStatus[jobName].lastRun = startTime;
  jobStatus[jobName].totalRuns++;

  try {
    const result = await runAutomatedBlogGeneration("city");

    if (result.success) {
      jobStatus[jobName].lastSuccess = new Date();
      jobStatus[jobName].successfulRuns++;
      console.log(
        `✅ Wednesday city-specific blog generation completed successfully`
      );
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    jobStatus[jobName].lastError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
    };
    jobStatus[jobName].failedRuns++;
    console.error(
      `❌ Wednesday city-specific blog generation failed:`,
      error.message
    );
  } finally {
    jobStatus[jobName].isRunning = false;
    const duration = new Date() - startTime;
    console.log(
      `⏱️  Wednesday city-specific blog generation job completed in ${duration}ms`
    );
  }
}

/**
 * Friday - Problem-solving blog generation job
 */
async function weeklyProblemSolvingJob() {
  const jobName = "weeklyProblemSolving";
  const startTime = new Date();

  console.log(
    `\n💡 Starting Friday problem-solving blog generation job at ${startTime.toISOString()}`
  );

  jobStatus[jobName].isRunning = true;
  jobStatus[jobName].lastRun = startTime;
  jobStatus[jobName].totalRuns++;

  try {
    const result = await runAutomatedBlogGeneration("problemSolving");

    if (result.success) {
      jobStatus[jobName].lastSuccess = new Date();
      jobStatus[jobName].successfulRuns++;
      console.log(
        `✅ Friday problem-solving blog generation completed successfully`
      );
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    jobStatus[jobName].lastError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
    };
    jobStatus[jobName].failedRuns++;
    console.error(
      `❌ Friday problem-solving blog generation failed:`,
      error.message
    );
  } finally {
    jobStatus[jobName].isRunning = false;
    const duration = new Date() - startTime;
    console.log(
      `⏱️  Friday problem-solving blog generation job completed in ${duration}ms`
    );
  }
}

/**
 * Daily status check job
 */
async function dailyStatusCheckJob() {
  const jobName = "dailyStatusCheck";
  const startTime = new Date();
  jobStatus[jobName].isRunning = true;
  jobStatus[jobName].lastRun = startTime;
  jobStatus[jobName].totalRuns++;

  try {
    const stats = await getAutomationStats();

    console.log(
      `   - Total automated posts (30 days): ${stats.totalAutomatedPosts}`
    );

    if (stats.lastAutomatedPost) {
      console.log(
        `   - Last automated date: ${stats.lastAutomatedPost.automationDate}`
      );
    }

    jobStatus[jobName].lastSuccess = new Date();
    jobStatus[jobName].successfulRuns++;
  } catch (error) {
    jobStatus[jobName].lastError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
    };
    jobStatus[jobName].failedRuns++;
    console.error(`❌ Daily status check failed:`, error.message);
  } finally {
    jobStatus[jobName].isRunning = false;
    const duration = new Date() - startTime;
  }
}

/**
 * Health check job
 */
async function healthCheckJob() {
  const jobName = "healthCheck";
  const startTime = new Date();
  jobStatus[jobName].isRunning = true;
  jobStatus[jobName].lastRun = startTime;
  jobStatus[jobName].totalRuns++;

  try {
    const healthStatus = {
      timestamp: startTime,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      cronJobs: Object.keys(jobStatus).map((jobName) => ({
        name: jobName,
        ...jobStatus[jobName],
      })),
    };

    console.log(
      `   - Memory usage: ${Math.round(
        healthStatus.memoryUsage.heapUsed / 1024 / 1024
      )}MB`
    );

    jobStatus[jobName].lastSuccess = new Date();
    jobStatus[jobName].successfulRuns++;
  } catch (error) {
    jobStatus[jobName].lastError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
    };
    jobStatus[jobName].failedRuns++;
    console.error(`❌ Health check failed:`, error.message);
  } finally {
    jobStatus[jobName].isRunning = false;
    const duration = new Date() - startTime;
  }
}

/**
 * Initialize and start all cron jobs
 */
export function initializeCronJobs() {
  const weeklyJob = cron.schedule(
    CRON_CONFIG.weeklyBlogGeneration,
    weeklyBlogGenerationJob,
    {
      scheduled: false,
      timezone: "America/New_York",
    }
  );

  const midWeekJob = cron.schedule(
    CRON_CONFIG.midWeekBlogGeneration,
    midWeekBlogGenerationJob,
    {
      scheduled: false,
      timezone: "America/New_York",
    }
  );

  const problemSolvingJob = cron.schedule(
    CRON_CONFIG.weeklyProblemSolving,
    weeklyProblemSolvingJob,
    {
      scheduled: false,
      timezone: "America/New_York",
    }
  );

  const dailyJob = cron.schedule(
    CRON_CONFIG.dailyStatusCheck,
    dailyStatusCheckJob,
    {
      scheduled: false,
      timezone: "America/New_York",
    }
  );

  const healthJob = cron.schedule(CRON_CONFIG.healthCheck, healthCheckJob, {
    scheduled: false,
    timezone: "America/New_York",
  });

  weeklyJob.start();
  midWeekJob.start();
  problemSolvingJob.start();
  dailyJob.start();
  healthJob.start();

  console.log(
    `📅 Monday construction blog: ${CRON_CONFIG.weeklyBlogGeneration} (EST)`
  );
  console.log(
    `📅 Wednesday city-specific blog: ${CRON_CONFIG.midWeekBlogGeneration} (EST)`
  );
  console.log(
    `📅 Friday problem-solving blog: ${CRON_CONFIG.weeklyProblemSolving} (EST)`
  );

  return {
    weeklyJob,
    midWeekJob,
    problemSolvingJob,
    dailyJob,
    healthJob,
  };
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs(jobs) {
  if (jobs) {
    jobs.weeklyJob.stop();
    jobs.midWeekJob.stop();
    jobs.problemSolvingJob.stop();
    jobs.dailyJob.stop();
    jobs.healthJob.stop();
  }
}

/**
 * Get cron job status
 */
export function getCronJobStatus() {
  return {
    jobs: jobStatus,
    config: CRON_CONFIG,
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };
}

/**
 * Manually trigger a job (for testing)
 */
export async function triggerJob(jobName) {
  switch (jobName) {
    case "weeklyBlogGeneration":
      await weeklyBlogGenerationJob();
      break;
    case "midWeekBlogGeneration":
      await midWeekBlogGenerationJob();
      break;
    case "weeklyProblemSolving":
      await weeklyProblemSolvingJob();
      break;
    case "dailyStatusCheck":
      await dailyStatusCheckJob();
      break;
    case "healthCheck":
      await healthCheckJob();
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
}

/**
 * Test cron job system
 */
export async function testCronSystem() {
  try {
    await healthCheckJob();

    await dailyStatusCheckJob();

    return true;
  } catch (error) {
    console.error("❌ Cron job test failed:", error);
    return false;
  }
}
