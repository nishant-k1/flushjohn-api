import cron from "node-cron";
import { cleanupOldPDFs } from "../services/pdfService.js";

/**
 * Schedule automatic PDF cleanup
 * Runs daily at 2:00 AM server time
 * Deletes PDFs older than configured days (default: 1)
 */
export const schedulePDFCleanup = () => {
  const cleanupEnabled = process.env.AUTO_PDF_CLEANUP !== "false"; // Enabled by default
  const maxAgeInDays = parseInt(process.env.PDF_MAX_AGE_DAYS) || 1;
  const cronSchedule = process.env.PDF_CLEANUP_SCHEDULE || "0 2 * * *"; // Daily at 2 AM

  if (!cleanupEnabled) {
    console.log("ℹ️ Automatic PDF cleanup is disabled");
    return;
  }

  // Validate cron schedule
  if (!cron.validate(cronSchedule)) {
    console.error(`❌ Invalid PDF cleanup schedule: ${cronSchedule}`);
    return;
  }

  // Schedule the cleanup task
  const task = cron.schedule(
    cronSchedule,
    async () => {
      try {
        console.log(
          `🧹 Running scheduled PDF cleanup (delete files older than ${maxAgeInDays} days)...`
        );
        const result = await cleanupOldPDFs(maxAgeInDays);
        console.log(`✅ ${result.message}`);

        if (result.deleted > 0) {
          console.log(`🗑️ Deleted files:`, result.files);
        }
      } catch (error) {
        console.error("❌ Scheduled PDF cleanup failed:", error);
      }
    },
    {
      scheduled: true,
      timezone: process.env.TIMEZONE || "UTC",
    }
  );

  console.log(
    `✅ PDF cleanup scheduled: ${cronSchedule} (Delete files older than ${maxAgeInDays} days)`
  );
  console.log(`ℹ️ Timezone: ${process.env.TIMEZONE || "UTC"}`);

  return task;
};

/**
 * Run cleanup immediately on startup (optional)
 */
export const runCleanupOnStartup = async () => {
  const runOnStartup = process.env.PDF_CLEANUP_ON_STARTUP === "true";

  if (!runOnStartup) {
    return;
  }

  try {
    const maxAgeInDays = parseInt(process.env.PDF_MAX_AGE_DAYS) || 1;
    console.log(
      `🧹 Running PDF cleanup on startup (delete files older than ${maxAgeInDays} days)...`
    );
    const result = await cleanupOldPDFs(maxAgeInDays);
    console.log(`✅ ${result.message}`);
  } catch (error) {
    console.error("❌ Startup PDF cleanup failed:", error);
  }
};
