/**
 * File Management Feature
 * Provides services for file operations, cleanup, and management
 */

import imageCleanupCron from "./services/imageCleanupCron.js";
import imageCleanupQueue from "./services/imageCleanupQueue.js";
import imageCleanupService from "./services/imageCleanupService.js";
import pdfService from "./services/pdfService.js";

export default {
  services: {
    imageCleanupCron,
    imageCleanupQueue,
    imageCleanupService,
    pdfService,
  },
};
