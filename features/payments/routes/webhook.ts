/**
 * Stripe Webhook Route
 * Handles Stripe webhook events (needs raw body)
 */

import { Router } from "express";
import * as paymentsService from "../services/paymentsService.js";

const router: any = Router();

router.post("/", async function (req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      res.status(400).json({
        success: false,
        message: "Webhook secret not configured",
        error: "WEBHOOK_SECRET_MISSING",
      }); return;
    }

    const { stripe } = await import("../services/stripeService.js");

    let event;
    try {
      // req.body should be raw buffer for Stripe webhooks
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`); return;
    }

    // Handle the event
    await paymentsService.handleStripeWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: "WEBHOOK_ERROR",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
});

export default router;

