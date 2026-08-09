/**
 * Stripe Webhook Route
 * Handles Stripe webhook events (needs raw body)
 */

import { Router } from "express";
import * as paymentsService from "../services/paymentsService.js";

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
      // req.body should be raw buffer for Stripe webhooks
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(
        `✅ [${requestId}] Webhook signature verified. Event type: ${event.type}, ID: ${event.id}`
      );
    } catch (err: any) {
      console.error(
        `❌ [${requestId}] Webhook signature verification failed:`,
        err.message
      );
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    console.log(`🔄 [${requestId}] Processing webhook event: ${event.type}`);
    try {
      await paymentsService.handleStripeWebhook(event);
      console.log(`✅ [${requestId}] Webhook event processed successfully`);
    } catch (processingError: any) {
      console.error(
        `❌ [${requestId}] Webhook processing error (acknowledged):`,
        processingError
      );

      try {
        const { emitPaymentError } =
          await import("../../salesOrders/sockets/salesOrders.js");

        let salesOrderId = null;
        if (
          event.type === "checkout.session.completed" &&
          event.data?.object?.metadata?.salesOrderId
        ) {
          salesOrderId = event.data.object.metadata.salesOrderId;
        } else if (
          event.type === "payment_intent.succeeded" ||
          event.type === "payment_intent.payment_failed"
        ) {
          const { findByStripePaymentIntentId } =
            await import("../repositories/paymentsRepository.js");
          const payment = await findByStripePaymentIntentId(
            event.data?.object?.id
          );
          if (payment) {
            salesOrderId =
              typeof payment.salesOrder === "object" && payment.salesOrder?._id
                ? payment.salesOrder._id
                : payment.salesOrder;
          }
        }

        if (salesOrderId) {
          emitPaymentError(
            salesOrderId,
            "webhook_processing_failed",
            `Webhook processing failed: ${
              processingError.message || "Unknown error"
            }. Please check the payment status manually.`,
            {
              eventType: event.type,
              eventId: event.id,
              error: processingError.message,
            }
          );
        }
      } catch (emitError) {
        console.error("Failed to emit webhook error event:", emitError);
      }
    }

  res.json({ received: true, requestId, eventType: event.type });
  } catch (error: any) {
    console.error(`❌ [${requestId}] Webhook signature/validation error:`, error.message);
    res.status(400).json({
      received: false,
      message: "Webhook validation failed",
      error: "WEBHOOK_VALIDATION_ERROR",
      requestId,
    });
  }
});

export default router;
