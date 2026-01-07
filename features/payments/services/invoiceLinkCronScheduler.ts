/**
 * Cron Job Scheduler for Auto-Cancelling Expired Invoice Links
 * Automatically cancels invoice payment links that are older than 24 hours
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", "..", "..", ".env") });

import cron from "node-cron";
import * as paymentsRepository from "../repositories/paymentsRepository.js";
import { cancelPaymentLink } from "./paymentsService.js";

const CRON_CONFIG = {
  // Run every hour to check for expired invoice links
  cancelExpiredInvoiceLinks: "0 * * * *",
};

let jobStatus = {
  cancelExpiredInvoiceLinks: {
    isRunning: false,
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    cancelledCount: 0,
  },
};

/**
 * Cancel expired invoice links (older than 24 hours)
 */
async function cancelExpiredInvoiceLinksJob() {
  const jobName = "cancelExpiredInvoiceLinks";
  const startTime = new Date();

  jobStatus[jobName].isRunning = true;
  jobStatus[jobName].lastRun = startTime;
  jobStatus[jobName].totalRuns++;

  try {
    // Calculate the cutoff time: 24 hours ago
    const { calculateInvoiceExpirationCutoff } = await import(
      "../../../utils/invoiceExpirationCalculations.js"
    );
    const cutoffTime = calculateInvoiceExpirationCutoff();

    // Find all pending payment links created more than 24 hours ago
    const expiredPayments = await paymentsRepository.findAll({
      query: {
        paymentMethod: "payment_link",
        status: "pending",
        createdAt: { $lte: cutoffTime },
      },
      sort: { createdAt: 1 },
      skip: 0,
      limit: 1000, // Process up to 1000 at a time
    });

    let cancelledCount = 0;
    let errorCount = 0;

    // Cancel each expired payment link
    for (const payment of expiredPayments) {
      try {
        await cancelPaymentLink(payment._id.toString());
        cancelledCount++;
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to cancel expired payment link ${payment._id}:`,
          error.message
        );
        // Continue with other payments even if one fails
      }
    }

    jobStatus[jobName].cancelledCount += cancelledCount;
    jobStatus[jobName].lastSuccess = new Date();
    jobStatus[jobName].successfulRuns++;

    if (cancelledCount > 0 || errorCount > 0) {
      console.log(
        `✅ Cancelled ${cancelledCount} expired invoice links${
          errorCount > 0 ? ` (${errorCount} errors)` : ""
        }`
      );
    }
  } catch (error) {
    jobStatus[jobName].lastError = {
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
    };
    jobStatus[jobName].failedRuns++;
    console.error(`❌ Failed to cancel expired invoice links:`, error.message);
  } finally {
    jobStatus[jobName].isRunning = false;
  }
}

/**
 * Initialize and start the cron job
 */
export function initializeInvoiceLinkCronJob() {
  const job = cron.schedule(
    CRON_CONFIG.cancelExpiredInvoiceLinks,
    cancelExpiredInvoiceLinksJob,
    {
      scheduled: false,
      timezone: "America/New_York",
    }
  );

  job.start();

  console.log(
    `✅ Invoice link auto-cancellation cron job started (runs every hour)`
  );

  return {
    job,
  };
}

/**
 * Stop the cron job
 */
export function stopInvoiceLinkCronJob(job) {
  if (job) {
    job.stop();
  }
}

/**
 * Get cron job status
 */
export function getInvoiceLinkCronJobStatus() {
  return {
    job: jobStatus.cancelExpiredInvoiceLinks,
    config: CRON_CONFIG,
  };
}

/**
 * Manually trigger the job (for testing)
 */
export async function triggerCancelExpiredInvoiceLinks() {
  await cancelExpiredInvoiceLinksJob();
}
