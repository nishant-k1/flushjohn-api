/**
 * File Management Feature
 * Provides services for file operations, cleanup, and management
 */

import imageCleanupCron from "./services/imageCleanupCron.js";
import imageCleanupQueue from "./services/imageCleanupQueue.js";
import imageCleanupService from "./services/imageCleanupService.js";
import pdfService from "./services/pdfService.js";
import pdfCleanupRoutes from "./routes/pdfCleanup.js";
import pdfCleanupJobs from "./jobs/pdfCleanup.js";

export default {
  services: {
    imageCleanupCron,
    imageCleanupQueue,
    imageCleanupService,
    pdfService,
  },
  routes: {
    pdfCleanup: pdfCleanupRoutes,
  },
  jobs: {
    pdfCleanup: pdfCleanupJobs,
  },
  scripts: {
    setupS3Lifecycle: "./scripts/setup-s3-lifecycle.js",
  },
};
