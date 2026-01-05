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
        return;
    }
    if (!cron.validate(cronSchedule)) {
        return;
    }
    const task = cron.schedule(cronSchedule, async () => {
        try {
            const result = await cleanupOldPDFs(maxAgeInDays);
            if (result.deleted > 0) {
            }
        }
        catch (error) {
        }
    }, {
        scheduled: true,
        timezone: process.env.TIMEZONE || "UTC",
    });
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
        const result = await cleanupOldPDFs(maxAgeInDays);
    }
    catch (error) {
    }
};
//# sourceMappingURL=pdfCleanup.js.map