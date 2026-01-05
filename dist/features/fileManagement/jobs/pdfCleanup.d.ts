import cron from "node-cron";
/**
 * Schedule automatic PDF cleanup
 * Runs daily at 2:00 AM server time
 * Deletes PDFs older than configured days (default: 1)
 */
export declare const schedulePDFCleanup: () => cron.ScheduledTask;
/**
 * Run cleanup immediately on startup (optional)
 */
export declare const runCleanupOnStartup: () => Promise<void>;
//# sourceMappingURL=pdfCleanup.d.ts.map