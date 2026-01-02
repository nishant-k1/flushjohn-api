/**
 * Common Services Feature
 * Provides shared services used across multiple features
 */

import alertService from "./services/alertService.js";
import * as emailService from "./services/emailService.js";
import * as s3Service from "./services/s3Service.js";
import dashboardRouter from "./routes/dashboard.js";
import phoneRouter from "./routes/phone.js";

export default {
  services: {
    alertService,
    emailService,
    s3Service,
  },
  routes: {
    dashboard: dashboardRouter,
    phone: phoneRouter,
  },
};
