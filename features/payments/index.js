/**
 * Payments Feature
 */

import paymentsRouter from "./routes/payments.js";
import webhookRouter from "./routes/webhook.js";

export default {
  routes: {
    payments: paymentsRouter,
    webhook: webhookRouter,
  },
};

