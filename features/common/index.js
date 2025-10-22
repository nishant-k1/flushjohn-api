/**
 * Common Services Feature
 * Provides shared services used across multiple features
 */

import alertService from "./services/alertService.js";
import emailService from "./services/emailService.js";
import s3Service from "./services/s3Service.js";

export default {
  services: {
    alertService,
    emailService,
    s3Service,
  },
};
