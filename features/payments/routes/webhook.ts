/**
 * Stripe Webhook Route
 * Handles Stripe webhook events (needs raw body)
 */

import { Router } from "express";
import * as paymentsService from "../services/paymentsService.js";
import WebhookEvent from "../models/WebhookEvent.js";

const router: any = Router();

router.post("/", async function (req, res) {
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();

  try {
    console.log(`🔔 [${requestId}] Webhook received at ${timestamp}`);

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(`❌ [${requestId}] Webhook secret not configured`);
      res.status(400).json({
        success: false,
        message: "Webhook secret not configured",
        error: "WEBHOOK_SECRET_MISSING",
      });
      return;
    }

    if (!sig) {
      console.error(`❌ [${requestId}] Missing stripe-signature header`);
      res.status(400).json({
        success: false,
        message: "Missing stripe-signature header",
        error: "MISSING_SIGNATURE",
      });
      return;
    }

    const { getStripeClient } = await import("../services/stripeService.js");
    const stripe = getStripeClient();

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`✅ [${requestId}] Webhook signature verified. Event type: ${event.type}, ID: ${event.id}`);
    } catch (err: any) {
      console.error(`❌ [${requestId}] Webhook signature verification failed:`, err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Deduplication: skip already-processed events
    try {
      const existing = await (WebhookEvent as any).findOne({ eventId: event.id });
      if (existing) {
        console.log(`ℹ️ [${requestId}] Duplicate event ${event.id}, skipping`);
        return res.json({ received: true, requestId, eventType: event.type, duplicate: true });
      }
    } catch (dedupError: any) {
      console.warn(`⚠️ [${requestId}] Dedup check failed, proceeding:`, dedupError.message);
    }

    console.log(`🔄 [${requestId}] Processing webhook event: ${event.type}`);
    try {
      await paymentsService.handleStripeWebhook(event);
      console.log(`✅ [${requestId}] Webhook event processed successfully`);
    } catch (processingError: any) {
      console.error(`❌ [${requestId}] Webhook processing error (acknowledged):`, processingError);
    }

    // Record processed event for deduplication
    try {
      await (WebhookEvent as any).create({ eventId: event.id, eventType: event.type });
    } catch (dedupError: any) {
      if (dedupError.code !== 11000) {
        console.warn(`⚠️ [${requestId}] Failed to record event:`, dedupError.message);
      }
    }

    res.json({ received: true, requestId, eventType: event.type });
  } catch (error: any) {
    console.error(`❌ [${requestId}] Webhook validation error:`, error.message);
    res.status(400).json({
      received: false,
      message: "Webhook validation failed",
      error: "WEBHOOK_VALIDATION_ERROR",
      requestId,
    });
  }
});

export default router;
