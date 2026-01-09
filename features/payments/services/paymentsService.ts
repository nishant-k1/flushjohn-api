import * as paymentsRepository from "../repositories/paymentsRepository.js";
import * as salesOrdersRepository from "../../salesOrders/repositories/salesOrdersRepository.js";
import {
  createPaymentLink,
  createPaymentIntent,
  createOrGetStripeCustomer,
  attachPaymentMethodToCustomer,
  retrievePaymentIntent,
  retrievePaymentMethod,
  processRefund,
  listCustomerPaymentMethods,
  retrievePaymentLink,
} from "./stripeService.js";
import { calculateOrderTotal } from "../../../utils/productAmountCalculations.js";
import {
  centsToDollars,
  min,
  abs,
  add,
  subtract,
} from "../../../utils/priceCalculations.js";
import { getCurrentDateTime } from "../../../lib/dayjs.js";

/**
 * Payments Service
 * Business logic for payment operations
 */

/**
 * Calculate and update sales order payment totals
 */
export const updateSalesOrderPaymentTotals = async (salesOrderId) => {
  const salesOrder = await salesOrdersRepository.findById(salesOrderId);
  if (!salesOrder) {
    throw new Error("Sales Order not found");
  }

  // Calculate order total from products (as number for calculations)
  const orderTotal = parseFloat(calculateOrderTotal(salesOrder.products));

  // Get all successful payments for this sales order
  const payments = await paymentsRepository.findAll({
    query: {
      salesOrder: salesOrderId,
      status: { $in: ["succeeded", "refunded", "partially_refunded"] },
    },
    sort: { createdAt: -1 },
    skip: 0,
    limit: 1000,
  });

  // Calculate paid amount (sum of all successful payments minus refunds)
  // All payments with status succeeded/refunded/partially_refunded were originally successful
  // We count the original payment amount and subtract any refunds
  let totalPaid = 0;
  let totalRefunded = 0;

  payments.forEach((payment) => {
    if (
      payment.status === "succeeded" ||
      payment.status === "refunded" ||
      payment.status === "partially_refunded"
    ) {
      // Add the original payment amount
      totalPaid = add(totalPaid, payment.amount);
      // Add any refunded amount (0 for succeeded, amount for refunded, partial for partially_refunded)
      // Use nullish coalescing to preserve 0 values
      totalRefunded = add(totalRefunded, payment.refundedAmount ?? 0);
    }
  });

  // Use utility functions for payment calculations
  const { calculateNetPaidAmount, calculateBalanceDue } =
    await import("../../../utils/priceCalculations.js");
  const netPaidAmount = calculateNetPaidAmount(totalPaid, totalRefunded);
  const balanceDue = calculateBalanceDue(orderTotal, netPaidAmount);

  // Determine payment status
  let paymentStatus = "Unpaid";
  if (netPaidAmount >= orderTotal) {
    paymentStatus = totalRefunded > 0 ? "Refunded" : "Paid";
  } else if (netPaidAmount > 0) {
    paymentStatus = "Partially Paid";
  }

  // Update sales order
  const updatedSalesOrder = await salesOrdersRepository.updateById(
    salesOrderId,
    {
      orderTotal,
      paidAmount: netPaidAmount,
      balanceDue,
      paymentStatus,
    }
  );

  // Emit socket event for sales order update
  try {
    const { emitSalesOrderUpdated } =
      await import("../../salesOrders/sockets/salesOrders.js");
    emitSalesOrderUpdated(salesOrderId, updatedSalesOrder);
  } catch (error) {
    console.error("Failed to emit salesOrderUpdated event:", error);
  }

  return {
    orderTotal,
    paidAmount: netPaidAmount,
    balanceDue,
    paymentStatus,
  };
};

/**
 * Create payment link for sales order (reuses existing pending payment link if available)
 */
export const createSalesOrderPaymentLink = async (salesOrderId, returnUrl) => {
  const salesOrder = await salesOrdersRepository.findById(salesOrderId);
  if (!salesOrder) {
    throw new Error("Sales Order not found");
  }

  // Calculate order total (as number for comparison)
  const orderTotal = parseFloat(calculateOrderTotal(salesOrder.products));
  if (orderTotal <= 0) {
    throw new Error("Order total must be greater than 0");
  }

  // Check for existing pending payment link for this sales order
  const existingPayments = await paymentsRepository.findAll({
    query: {
      salesOrder: salesOrderId,
      paymentMethod: "payment_link",
      status: "pending",
      stripePaymentLinkId: { $exists: true, $ne: null },
    },
    sort: { createdAt: -1 },
    skip: 0,
    limit: 1,
  });

  // If an existing pending payment link exists, reuse it (if amount matches)
  if (existingPayments.length > 0) {
    const existingPayment = existingPayments[0];
    if (existingPayment.stripePaymentLinkId) {
      // Only reuse if the amount matches (order total hasn't changed)
      if (existingPayment.amount === orderTotal) {
        try {
          // Retrieve the payment link URL from Stripe
          const paymentLink = await retrievePaymentLink(
            existingPayment.stripePaymentLinkId
          );

          // Only reuse if the payment link is still active
          if (paymentLink.active) {
            return {
              paymentId: existingPayment._id.toString(),
              paymentLinkId: existingPayment.stripePaymentLinkId,
              url: paymentLink.url,
            };
          }
        } catch (error) {
          // If retrieval fails (link might be expired/invalid), create a new one
        }
      }
    }
  }

  // Get customer email from lead
  let customerEmail = "";
  let customerName = "";
  if (salesOrder.lead) {
    customerEmail = salesOrder.lead.email || "";
    customerName = `${salesOrder.lead.fName || ""} ${
      salesOrder.lead.lName || ""
    }`.trim();
    if (salesOrder.lead.cName) {
      customerName = salesOrder.lead.cName;
    }
  }

  // Create new payment link
  const { paymentLinkId, url } = await createPaymentLink({
    amount: orderTotal,
    description: `Payment for Sales Order #${salesOrder.salesOrderNo}`,
    metadata: {
      salesOrderId: salesOrderId.toString(),
      salesOrderNo: salesOrder.salesOrderNo.toString(),
    },
    customerEmail,
    customerName,
    returnUrl,
  });

  // Create payment record
  const payment = await paymentsRepository.create({
    salesOrder: salesOrderId,
    customer: salesOrder.customer || null,
    amount: orderTotal,
    currency: "usd",
    paymentMethod: "payment_link",
    stripePaymentLinkId: paymentLinkId,
    status: "pending",
    metadata: {
      salesOrderNo: salesOrder.salesOrderNo,
      returnUrl,
    },
  });

  return {
    paymentId: payment._id,
    paymentLinkId,
    url,
  };
};

/**
 * Charge saved card or new card
 */
export const chargeSalesOrder = async (
  salesOrderId,
  { paymentMethodId, saveCard = false, customerId = null }
) => {
  const salesOrder = await salesOrdersRepository.findById(salesOrderId);
  if (!salesOrder) {
    throw new Error("Sales Order not found");
  }

  // Calculate order total (as number for comparison)
  const orderTotal = parseFloat(calculateOrderTotal(salesOrder.products));
  if (orderTotal <= 0) {
    throw new Error("Order total must be greater than 0");
  }

  // CRITICAL FIX: Check for existing pending or succeeded payment to prevent duplicates
  // This prevents double-charging if the API is called multiple times concurrently
  // Use a more robust check that considers both time and status
  const existingPayments = await paymentsRepository.findAll({
    query: {
      salesOrder: salesOrderId,
      status: { $in: ["pending", "succeeded"] },
    },
    sort: { createdAt: -1 },
    skip: 0,
    limit: 5, // Check last 5 payments for better duplicate detection
  });

  // If there's a very recent payment (within last 10 seconds), prevent duplicate
  // Increased window to account for network delays and concurrent requests
  if (existingPayments.length > 0) {
    const now = Date.now();
    const recentPayments = existingPayments.filter((payment) => {
      const timeSinceCreation = now - new Date(payment.createdAt).getTime();
      return timeSinceCreation < 10000; // 10 second window
    });

    if (recentPayments.length > 0) {
      const mostRecent = recentPayments[0];
      const timeSinceCreation = now - new Date(mostRecent.createdAt).getTime();
      
      // If payment is very recent (within 10 seconds), it's likely a duplicate
      if (timeSinceCreation < 10000) {
        // Check if it's a succeeded payment - definitely a duplicate
        if (mostRecent.status === "succeeded") {
          throw new Error(
            `A payment for this order was already completed. Payment ID: ${mostRecent._id}`
          );
        }
        
        // If it's pending and very recent, likely a duplicate request
        if (mostRecent.status === "pending" && timeSinceCreation < 5000) {
          throw new Error(
            "A payment is already being processed for this order. Please wait a moment before retrying."
          );
        }
      }
    }
  }

  // Get or create Stripe customer
  let stripeCustomerId = customerId || salesOrder.stripeCustomerId;
  if (!stripeCustomerId) {
    // Get customer email from lead
    let customerEmail = "";
    let customerName = "";
    if (salesOrder.lead) {
      customerEmail = salesOrder.lead.email || "";
      customerName = `${salesOrder.lead.fName || ""} ${
        salesOrder.lead.lName || ""
      }`.trim();
      if (salesOrder.lead.cName) {
        customerName = salesOrder.lead.cName;
      }
    }

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    const stripeCustomer = await createOrGetStripeCustomer(
      customerEmail,
      customerName,
      {
        salesOrderId: salesOrderId.toString(),
        salesOrderNo: salesOrder.salesOrderNo.toString(),
      }
    );

    stripeCustomerId = stripeCustomer.id;

    // Update sales order with Stripe customer ID
    await salesOrdersRepository.updateById(salesOrderId, {
      stripeCustomerId,
    });
  }

  // Attach payment method to customer if saving
  if (saveCard && paymentMethodId) {
    await attachPaymentMethodToCustomer(paymentMethodId, stripeCustomerId);
  }

  // Create payment intent
  const paymentIntent = await createPaymentIntent({
    amount: orderTotal,
    currency: "usd",
    customerId: stripeCustomerId,
    paymentMethodId,
    description: `Payment for Sales Order #${salesOrder.salesOrderNo}`,
    metadata: {
      salesOrderId: salesOrderId.toString(),
      salesOrderNo: salesOrder.salesOrderNo.toString(),
    },
    savePaymentMethod: saveCard,
  });

  // Get card details from payment method if available
  let cardLast4 = null;
  let cardBrand = null;
  if (paymentMethodId) {
    try {
      const paymentMethod = await retrievePaymentMethod(paymentMethodId);
      if (paymentMethod.card) {
        cardLast4 = paymentMethod.card.last4;
        cardBrand = paymentMethod.card.brand;
      }
    } catch (error) {
      // Ignore errors retrieving card details
    }
  }

  // If payment succeeded, get card details from charge
  if (
    paymentIntent.status === "succeeded" &&
    (paymentIntent as any).charges?.data?.[0]
  ) {
    const charge = (paymentIntent as any).charges.data[0];
    if (charge.payment_method_details?.card && !cardLast4) {
      const card = charge.payment_method_details.card;
      cardLast4 = card.last4;
      cardBrand = card.brand;
    }
  }

  // Get charge ID if payment succeeded
  const chargeId =
    (paymentIntent.status === "succeeded" &&
      (paymentIntent as any).charges?.data?.[0]?.id) ||
    null;

  // CRITICAL FIX: Check for existing payment with same payment intent ID before creating
  // This prevents duplicate payments from concurrent requests
  const existingPaymentWithIntent = await paymentsRepository.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (existingPaymentWithIntent) {
    // Payment with this intent already exists - return it instead of creating duplicate
    console.warn(
      `⚠️ Payment with intent ${paymentIntent.id} already exists. Returning existing payment.`
    );
    return {
      paymentId: existingPaymentWithIntent._id,
      paymentIntentId: paymentIntent.id,
      status: existingPaymentWithIntent.status,
      clientSecret: paymentIntent.client_secret,
      requiresAction: paymentIntent.status === "requires_action",
    };
  }

  // Create payment record with duplicate protection
  let payment;
  try {
    payment = await paymentsRepository.create({
      salesOrder: salesOrderId,
      customer: salesOrder.customer || null,
      amount: orderTotal,
      currency: "usd",
      paymentMethod: saveCard ? "saved_card" : "card",
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: chargeId,
      stripeCustomerId,
      stripePaymentMethodId: paymentMethodId || null,
      status: paymentIntent.status === "succeeded" ? "succeeded" : "pending",
      cardLast4,
      cardBrand,
      metadata: {
        salesOrderNo: salesOrder.salesOrderNo,
      },
    });
  } catch (createError: any) {
    // Handle duplicate key error (unique index on stripePaymentIntentId)
    if (createError.code === 11000 || createError.name === "MongoServerError") {
      // Duplicate payment intent - fetch existing one
      const existingPayment = await paymentsRepository.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });
      if (existingPayment) {
        console.warn(
          `⚠️ Duplicate payment prevented. Returning existing payment for intent ${paymentIntent.id}`
        );
        return {
          paymentId: existingPayment._id,
          paymentIntentId: paymentIntent.id,
          status: existingPayment.status,
          clientSecret: paymentIntent.client_secret,
          requiresAction: paymentIntent.status === "requires_action",
        };
      }
    }
    // Re-throw if it's not a duplicate error
    throw createError;
  }

  // Emit socket event for payment creation
  try {
    const { emitPaymentCreated } =
      await import("../../salesOrders/sockets/salesOrders.js");
    emitPaymentCreated(salesOrderId, payment);
  } catch (error) {
    console.error("Failed to emit paymentCreated event:", error);
  }

  // If payment succeeded immediately, the webhook will handle the rest
  // We only update sales order totals here, and let the webhook handle email sending
  // This prevents duplicate processing when both immediate response and webhook fire
  if (paymentIntent.status === "succeeded") {
    // Cancel any pending payment links for this sales order
    await cancelPendingPaymentLinksForSalesOrder(salesOrderId);

    // Update sales order with Stripe customer ID if not already set
    if (!salesOrder.stripeCustomerId) {
      await salesOrdersRepository.updateById(salesOrderId, {
        stripeCustomerId,
      });
    }

    // Update totals - webhook will also do this, but it's idempotent
    // The webhook is the source of truth, so we update here for immediate UI feedback
    await updateSalesOrderPaymentTotals(salesOrderId);

    // Send receipt email immediately when payment succeeds
    // Webhook will also try to send, but sendReceiptAndMarkSent prevents duplicates
    try {
      const updatedPayment = await paymentsRepository.findById(payment._id);
      const updatedSalesOrder =
        await salesOrdersRepository.findById(salesOrderId);
      await sendReceiptAndMarkSent(updatedPayment, updatedSalesOrder);
    } catch (receiptError) {
      // Log error but don't fail the payment - receipt can be sent manually later
      console.error(
        "❌ Error sending receipt email immediately:",
        receiptError
      );
    }
  }

  return {
    paymentId: payment._id,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
    requiresAction: paymentIntent.status === "requires_action",
  };
};

/**
 * Process refund for payment
 */
export const refundPayment = async (
  paymentId,
  refundAmount = null,
  reason = "requested_by_customer"
) => {
  const payment = await paymentsRepository.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  if (
    payment.status !== "succeeded" &&
    payment.status !== "partially_refunded"
  ) {
    throw new Error("Payment must be succeeded to refund");
  }

  // Get charge ID from payment record, or retrieve from Stripe if missing
  let chargeId = payment.stripeChargeId;

  if (!chargeId && payment.stripePaymentIntentId) {
    // Try to get charge ID from payment intent
    try {
      const paymentIntent = await retrievePaymentIntent(
        payment.stripePaymentIntentId
      );

      if (
        paymentIntent.status === "succeeded" &&
        (paymentIntent as any).charges?.data?.[0]?.id
      ) {
        chargeId = (paymentIntent as any).charges.data[0].id;

        // Update payment record with charge ID for future use
        await paymentsRepository.updateById(paymentId, {
          stripeChargeId: chargeId,
        });
      }
    } catch (error) {
      console.error("Error retrieving payment intent:", error);
    }
  }

  if (!chargeId && !payment.stripePaymentIntentId) {
    throw new Error(
      "Charge ID or Payment Intent ID not found for this payment"
    );
  }

  // Use utility function for available refund calculation
  const { calculateAvailableRefund } =
    await import("../../../utils/priceCalculations.js");
  // Use nullish coalescing to preserve 0 values
  const availableToRefund = calculateAvailableRefund(
    payment.amount,
    payment.refundedAmount ?? 0
  );
  if (availableToRefund <= 0) {
    throw new Error("No amount available to refund");
  }

  const refundAmountToProcess =
    refundAmount !== null ? refundAmount : availableToRefund;
  if (refundAmountToProcess > availableToRefund) {
    throw new Error(
      `Refund amount exceeds available amount. Available: $${availableToRefund.toFixed(
        2
      )}`
    );
  }

  // Process refund
  // Get sales order ID - handle both populated and unpopulated cases
  const salesOrderId =
    typeof payment.salesOrder === "object" && payment.salesOrder?._id
      ? payment.salesOrder._id.toString()
      : payment.salesOrder?.toString() || payment.salesOrder;

  // Get sales order ID object for updateSalesOrderPaymentTotals
  const salesOrderIdForUpdate =
    typeof payment.salesOrder === "object" && payment.salesOrder?._id
      ? payment.salesOrder._id
      : payment.salesOrder;

  const refund = await processRefund({
    chargeId: chargeId || null,
    paymentIntentId: payment.stripePaymentIntentId || null,
    amount: refundAmount !== null ? refundAmount : null, // null = full refund
    reason,
    metadata: {
      paymentId: paymentId.toString(),
      salesOrderId: salesOrderId,
    },
  });

  // Update payment record
  // Use nullish coalescing to preserve 0 values
  const newRefundedAmount =
    (payment.refundedAmount ?? 0) + refundAmountToProcess;
  const newStatus =
    newRefundedAmount >= payment.amount ? "refunded" : "partially_refunded";

  const updatedPayment = await paymentsRepository.updateById(paymentId, {
    refundedAmount: newRefundedAmount,
    status: newStatus,
  });

  // Emit socket event for payment update
  try {
    const { emitPaymentUpdated } =
      await import("../../salesOrders/sockets/salesOrders.js");
    emitPaymentUpdated(salesOrderIdForUpdate, updatedPayment);
  } catch (error) {
    console.error("Failed to emit paymentUpdated event:", error);
  }

  // Update sales order payment totals
  await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);

  return {
    refundId: refund.id,
    amount: centsToDollars(refund.amount), // Convert from cents
    status: refund.status,
    paymentStatus: newStatus,
  };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  return await paymentsRepository.findById(paymentId);
};

/**
 * Get payments for sales order
 */
/**
 * Get saved payment methods for a customer
 */
export const getCustomerPaymentMethods = async (stripeCustomerId) => {
  if (!stripeCustomerId) {
    return [];
  }

  try {
    const paymentMethods = await listCustomerPaymentMethods(stripeCustomerId);
    return paymentMethods.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : null,
      created: pm.created,
    }));
  } catch (error) {
    console.error("Error fetching customer payment methods:", error);
    throw new Error(`Failed to fetch payment methods: ${error.message}`);
  }
};

/**
 * Save payment method for customer (without charging)
 */
export const savePaymentMethod = async (
  salesOrderId,
  { paymentMethodId, customerId = null }
) => {
  const salesOrder = await salesOrdersRepository.findById(salesOrderId);
  if (!salesOrder) {
    throw new Error("Sales Order not found");
  }

  // Get or create Stripe customer
  let stripeCustomerId = customerId || salesOrder.stripeCustomerId;
  if (!stripeCustomerId) {
    // Get customer email from lead
    let customerEmail = "";
    let customerName = "";
    if (salesOrder.lead) {
      customerEmail = salesOrder.lead.email || "";
      customerName = `${salesOrder.lead.fName || ""} ${
        salesOrder.lead.lName || ""
      }`.trim();
      if (salesOrder.lead.cName) {
        customerName = salesOrder.lead.cName;
      }
    }

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    const stripeCustomer = await createOrGetStripeCustomer(
      customerEmail,
      customerName,
      {
        salesOrderId: salesOrderId.toString(),
        salesOrderNo: salesOrder.salesOrderNo.toString(),
      }
    );

    stripeCustomerId = stripeCustomer.id;

    // Update sales order with Stripe customer ID
    await salesOrdersRepository.updateById(salesOrderId, {
      stripeCustomerId,
    });
  }

  // Attach payment method to customer
  if (paymentMethodId) {
    await attachPaymentMethodToCustomer(paymentMethodId, stripeCustomerId);
  }

  return {
    stripeCustomerId,
    paymentMethodId,
  };
};

/**
 * Delete payment method for customer
 */
export const deletePaymentMethod = async (paymentMethodId) => {
  try {
    const { detachPaymentMethodFromCustomer } =
      await import("../services/stripeService.js");
    await detachPaymentMethodFromCustomer(paymentMethodId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment method:", error);
    throw new Error(`Failed to delete payment method: ${error.message}`);
  }
};

export const getPaymentsBySalesOrder = async (salesOrderId) => {
  return await paymentsRepository.findBySalesOrder(salesOrderId);
};

/**
 * Send receipt email and mark as sent (prevents duplicates)
 * Internal helper function
 */
const sendReceiptAndMarkSent = async (payment, salesOrder) => {
  // Check if receipt was already sent
  if (payment.receiptSent) {
    console.log(
      `ℹ️ Receipt already sent for payment ${payment._id}, skipping duplicate send`
    );
    return true;
  }

  try {
    const { sendSalesReceiptEmail } = await import("./sendReceiptEmail.js");
    const success = await sendSalesReceiptEmail(payment, salesOrder);

    if (success) {
      // Mark receipt as sent
      await paymentsRepository.updateById(payment._id, {
        receiptSent: true,
        receiptSentAt: getCurrentDateTime(),
      });
      console.log(
        `✅ Payment receipt email sent successfully for payment ${payment._id}`
      );
      return true;
    } else {
      console.warn(
        `⚠️ Payment receipt email failed to send for payment ${payment._id}`
      );
      return false;
    }
  } catch (error) {
    console.error(
      `❌ Error sending receipt email for payment ${payment._id}:`,
      error
    );
    return false;
  }
};

/**
 * Manually send payment receipt email
 * Can be called multiple times for the same payment (will skip if already sent)
 */
export const sendPaymentReceipt = async (paymentId) => {
  const payment = await paymentsRepository.findById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "succeeded") {
    throw new Error("Can only send receipt for successful payments");
  }

  // Get sales order
  const salesOrderId =
    typeof payment.salesOrder === "object" && payment.salesOrder?._id
      ? payment.salesOrder._id
      : payment.salesOrder;

  const salesOrder = await salesOrdersRepository.findById(salesOrderId);

  if (!salesOrder) {
    throw new Error("Sales order not found");
  }

  // Send receipt email (will skip if already sent)
  const success = await sendReceiptAndMarkSent(payment, salesOrder);

  if (!success && !payment.receiptSent) {
    throw new Error("Failed to send receipt email");
  }

  return { success: true };
};

/**
 * Sync payment link status from Stripe
 * Checks Stripe directly to see if payment link has been paid and updates status
 */
export const syncPaymentLinkStatus = async (paymentId) => {
  const payment = await paymentsRepository.findById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.paymentMethod !== "payment_link") {
    throw new Error("Only payment link payments can be synced");
  }

  if (!payment.stripePaymentLinkId) {
    throw new Error("Payment link ID not found");
  }

  // If already succeeded, skip
  if (payment.status === "succeeded") {
    return { success: true, message: "Payment already marked as succeeded" };
  }

  try {
    const { getStripeClient } = await import("./stripeService.js");
    const stripe = getStripeClient();

    // List checkout sessions for this payment link
    const sessions = await (stripe as any).checkout.sessions.list({
      payment_link: payment.stripePaymentLinkId,
      limit: 100,
    });

    // Find a completed session with paid status
    const paidSession = sessions.data.find(
      (session) =>
        session.payment_status === "paid" && session.status === "complete"
    );

    if (paidSession) {
      // Update payment record
      let chargeId = null;
      let cardLast4 = null;
      let cardBrand = null;

      if (paidSession.payment_intent) {
        try {
          const { retrievePaymentIntent } = await import("./stripeService.js");
          const paymentIntent = await retrievePaymentIntent(
            paidSession.payment_intent
          );

          const charges = (paymentIntent as any).charges?.data || [];
          chargeId = charges.length > 0 ? charges[0].id : null;

          if (charges.length > 0 && charges[0].payment_method_details?.card) {
            const card = charges[0].payment_method_details.card;
            cardLast4 = card.last4;
            cardBrand = card.brand;
          }
        } catch (error) {
          console.error("Error retrieving payment intent:", error);
        }
      }

      const updatedPayment = await paymentsRepository.updateById(payment._id, {
        status: "succeeded",
        stripeChargeId: chargeId,
        stripePaymentIntentId: paidSession.payment_intent || null,
        cardLast4,
        cardBrand,
      });

      // Get sales order ID
      const salesOrderIdForUpdate =
        typeof payment.salesOrder === "object" && payment.salesOrder?._id
          ? payment.salesOrder._id
          : payment.salesOrder;

      // Emit socket event for payment update
      try {
        const { emitPaymentUpdated } =
          await import("../../salesOrders/sockets/salesOrders.js");
        emitPaymentUpdated(salesOrderIdForUpdate, updatedPayment);
      } catch (error) {
        console.error("Failed to emit paymentUpdated event:", error);
      }

      await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);

      // Cancel any pending payment links for this sales order
      await cancelPendingPaymentLinksForSalesOrder(salesOrderIdForUpdate);

      // Send receipt email automatically when payment succeeds via sync
      try {
        const finalPayment = await paymentsRepository.findById(payment._id);
        const finalSalesOrder = await salesOrdersRepository.findById(
          salesOrderIdForUpdate
        );
        await sendReceiptAndMarkSent(finalPayment, finalSalesOrder);
      } catch (receiptError) {
        // Log error but don't fail the sync - receipt can be sent manually later
        console.error(
          "❌ Error sending receipt email after sync:",
          receiptError
        );
      }

      return { success: true, message: "Payment status updated to succeeded" };
    }

    return {
      success: true,
      message: "No paid session found, payment still pending",
    };
  } catch (error) {
    console.error("Error syncing payment link status:", error);
    throw new Error(`Failed to sync payment link status: ${error.message}`);
  }
};

/**
 * Cancel all pending payment links for a sales order
 * Called automatically when a card payment succeeds
 */
export const cancelPendingPaymentLinksForSalesOrder = async (salesOrderId) => {
  try {
    // Find all pending payment links for this sales order
    const pendingPaymentLinks = await paymentsRepository.findAll({
      query: {
        salesOrder: salesOrderId,
        paymentMethod: "payment_link",
        status: "pending",
      },
    });

    // Cancel each pending payment link
    for (const payment of pendingPaymentLinks) {
      try {
        await cancelPaymentLink(payment._id.toString());
        console.log(
          `✅ Cancelled pending payment link ${payment._id} for sales order ${salesOrderId}`
        );
      } catch (error) {
        // Log error but continue with other payments
        console.error(
          `Failed to cancel pending payment link ${payment._id}:`,
          error.message
        );
      }
    }

    return {
      cancelledCount: pendingPaymentLinks.length,
    };
  } catch (error) {
    console.error(
      `Error cancelling pending payment links for sales order ${salesOrderId}:`,
      error
    );
    // Don't throw - this is a cleanup operation, shouldn't fail the main payment flow
    return {
      cancelledCount: 0,
      error: error.message,
    };
  }
};

/**
 * Cancel a pending payment link
 * Only cancels payment links (not card payments)
 */
export const cancelPaymentLink = async (paymentId) => {
  const payment = await paymentsRepository.findById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Only allow canceling payment links that are pending
  if (payment.paymentMethod !== "payment_link") {
    throw new Error("Only payment links can be cancelled");
  }

  if (payment.status !== "pending") {
    throw new Error(`Cannot cancel payment with status: ${payment.status}`);
  }

  // Update payment status to cancelled
  const updatedPayment = await paymentsRepository.updateById(paymentId, {
    status: "cancelled",
    errorMessage: "Payment link cancelled by user",
  });

  // Get sales order ID for socket event
  const salesOrderId =
    typeof payment.salesOrder === "object" && payment.salesOrder?._id
      ? payment.salesOrder._id
      : payment.salesOrder;

  // Emit socket event for payment update
  try {
    const { emitPaymentUpdated } =
      await import("../../salesOrders/sockets/salesOrders.js");
    emitPaymentUpdated(salesOrderId, updatedPayment);
  } catch (error) {
    console.error("Failed to emit paymentUpdated event:", error);
  }

  return { success: true };
};

/**
 * Handle Stripe webhook event
 */
export const handleStripeWebhook = async (event) => {
  console.log(`📥 Processing Stripe webhook: ${event.type} (ID: ${event.id})`);

  switch (event.type) {
    case "checkout.session.completed": {
      // Handle payment link payments
      const session = event.data.object;
      console.log(
        `  📋 Checkout session: ${session.id}, payment_status: ${session.payment_status}`
      );

      // Only process if payment_status is "paid"
      if (session.payment_status !== "paid") {
        console.log(`  ⏭️  Skipping: payment_status is not "paid"`);
        break;
      }

      // Primary method: Find payment by sales order ID from metadata
      // This is the most reliable way since we always include salesOrderId in metadata
      let payment = null;

      if (session.metadata?.salesOrderId) {
        const salesOrderId = session.metadata.salesOrderId;
        const amountInCents = session.amount_total || 0;
        const amountInDollars = centsToDollars(amountInCents);

        // Find pending payment link payments for this sales order
        // Match by amount (with small tolerance for floating point issues)
        const payments = await paymentsRepository.findAll({
          query: {
            salesOrder: salesOrderId,
            paymentMethod: "payment_link",
            status: "pending",
          },
          sort: { createdAt: -1 },
          limit: 10,
        });

        // Find the payment that matches the amount (within 0.01 tolerance)
        payment = payments.find(
          (p) => abs(subtract(p.amount, amountInDollars)) < 0.01
        );

        if (!payment && payments.length > 0) {
          // If no exact match, use the most recent one (amount might have changed)
          payment = payments[0];
        }
      }

      // Secondary method: Try to find by payment link ID if we have it
      if (!payment) {
        // Get payment link ID from session
        // session.payment_link can be a string ID or an object
        let paymentLinkId = null;

        if (typeof session.payment_link === "string") {
          paymentLinkId = session.payment_link;
        } else if (session.payment_link?.id) {
          paymentLinkId = session.payment_link.id;
        } else if (session.metadata?.paymentLinkId) {
          paymentLinkId = session.metadata.paymentLinkId;
        }

        if (paymentLinkId) {
          payment =
            await paymentsRepository.findByStripePaymentLinkId(paymentLinkId);
        }
      }

      if (!payment) {
        console.log(
          `  ⚠️  Payment not found for checkout session ${session.id}`
        );
        break;
      }

      console.log(
        `  ✅ Found payment: ${payment._id}, current status: ${payment.status}`
      );

      // Only process if payment is not already succeeded (prevent duplicate processing)
      if (payment.status === "succeeded") {
        console.log(`  ⏭️  Skipping: payment already succeeded`);
        break;
      }

      // Get charge ID from payment intent if available
      let chargeId = null;
      let cardLast4 = null;
      let cardBrand = null;

      if (session.payment_intent) {
        try {
          const { retrievePaymentIntent } = await import("./stripeService.js");
          const paymentIntent = await retrievePaymentIntent(
            session.payment_intent
          );

          const charges = (paymentIntent as any).charges?.data || [];
          chargeId = charges.length > 0 ? charges[0].id : null;

          if (charges.length > 0 && charges[0].payment_method_details?.card) {
            const card = charges[0].payment_method_details.card;
            cardLast4 = card.last4;
            cardBrand = card.brand;
          }
        } catch (error) {
          console.error(
            "Error retrieving payment intent for checkout session:",
            error
          );
        }
      }

      // Update payment record
      const updatedPayment = await paymentsRepository.updateById(payment._id, {
        status: "succeeded",
        stripeChargeId: chargeId,
        stripePaymentIntentId: session.payment_intent || null,
        cardLast4,
        cardBrand,
      });

      // Get sales order ID (handle both populated and unpopulated cases)
      const salesOrderIdForUpdate =
        typeof payment.salesOrder === "object" && payment.salesOrder?._id
          ? payment.salesOrder._id
          : payment.salesOrder;

      // Emit socket event for payment update (webhook)
      try {
        const { emitPaymentUpdated } =
          await import("../../salesOrders/sockets/salesOrders.js");
        emitPaymentUpdated(salesOrderIdForUpdate, updatedPayment);
      } catch (error) {
        console.error("Failed to emit paymentUpdated event:", error);
      }

      try {
        await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);
      } catch (totalsError) {
        console.error(
          "❌ Error updating sales order payment totals:",
          totalsError
        );
        // Emit error event for frontend notification
        try {
          const { emitPaymentError } =
            await import("../../salesOrders/sockets/salesOrders.js");
          emitPaymentError(
            salesOrderIdForUpdate,
            "payment_totals_update_failed",
            "Failed to update payment totals. Please refresh the page.",
            { paymentId: payment._id, error: totalsError.message }
          );
        } catch (emitError) {
          console.error("Failed to emit payment error event:", emitError);
        }
      }

      // Cancel any pending payment links for this sales order (only if this is a card payment, not a payment link)
      if (payment.paymentMethod !== "payment_link") {
        await cancelPendingPaymentLinksForSalesOrder(salesOrderIdForUpdate);
      }

      // Send sales receipt email (only once, prevents duplicates via receiptSent flag)
      console.log(
        `  📧 Attempting to send receipt email for payment ${payment._id}`
      );
      try {
        const updatedPayment = await paymentsRepository.findById(payment._id);
        const salesOrder = await salesOrdersRepository.findById(
          salesOrderIdForUpdate
        );
        const receiptSent = await sendReceiptAndMarkSent(
          updatedPayment,
          salesOrder
        );
        if (receiptSent) {
          console.log(`  ✅ Receipt email sent successfully`);
        } else {
          console.log(`  ⚠️  Receipt email not sent (may already be sent)`);
        }
      } catch (emailError) {
        console.error("❌ Error sending receipt email:", emailError);
        // Emit error event for frontend notification
        try {
          const { emitPaymentError } =
            await import("../../salesOrders/sockets/salesOrders.js");
          emitPaymentError(
            salesOrderIdForUpdate,
            "receipt_send_failed",
            "Payment succeeded but failed to send receipt email. You can manually send it from the payment details.",
            { paymentId: payment._id, error: emailError.message }
          );
        } catch (emitError) {
          console.error("Failed to emit payment error event:", emitError);
        }
        // Don't throw - email failure shouldn't break webhook processing
      }
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log(`  💳 Payment intent: ${paymentIntent.id}`);

      const payment = await paymentsRepository.findByStripePaymentIntentId(
        paymentIntent.id
      );

      if (payment) {
        console.log(
          `  ✅ Found payment: ${payment._id}, current status: ${payment.status}`
        );

        // Only process if payment is not already succeeded (prevent duplicate processing)
        if (payment.status === "succeeded") {
          console.log(`  ⏭️  Skipping: payment already succeeded`);
          break;
        }

        // Get charge ID
        const charges = paymentIntent.charges?.data || [];
        const chargeId = charges.length > 0 ? charges[0].id : null;

        // Get card details
        let cardLast4 = null;
        let cardBrand = null;
        if (charges.length > 0 && charges[0].payment_method_details?.card) {
          const card = charges[0].payment_method_details.card;
          cardLast4 = card.last4;
          cardBrand = card.brand;
        }

        const updatedPayment = await paymentsRepository.updateById(
          payment._id,
          {
            status: "succeeded",
            stripeChargeId: chargeId,
            cardLast4,
            cardBrand,
          }
        );

        // Get sales order ID (handle both populated and unpopulated cases)
        const salesOrderIdForUpdate =
          typeof payment.salesOrder === "object" && payment.salesOrder?._id
            ? payment.salesOrder._id
            : payment.salesOrder;

        // Emit socket event for payment update (webhook)
        try {
          const { emitPaymentUpdated } =
            await import("../../salesOrders/sockets/salesOrders.js");
          emitPaymentUpdated(salesOrderIdForUpdate, updatedPayment);
        } catch (error) {
          console.error("Failed to emit paymentUpdated event:", error);
        }

        try {
          await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);
        } catch (totalsError) {
          console.error(
            "❌ Error updating sales order payment totals:",
            totalsError
          );
          // Emit error event for frontend notification
          try {
            const { emitPaymentError } =
              await import("../../salesOrders/sockets/salesOrders.js");
            emitPaymentError(
              salesOrderIdForUpdate,
              "payment_totals_update_failed",
              "Failed to update payment totals. Please refresh the page.",
              { paymentId: payment._id, error: totalsError.message }
            );
          } catch (emitError) {
            console.error("Failed to emit payment error event:", emitError);
          }
        }

        // Cancel any pending payment links for this sales order (card payment succeeded)
        await cancelPendingPaymentLinksForSalesOrder(salesOrderIdForUpdate);

        // Send sales receipt email (only once, prevents duplicates via receiptSent flag)
        console.log(
          `  📧 Attempting to send receipt email for payment ${payment._id}`
        );
        try {
          const updatedPayment = await paymentsRepository.findById(payment._id);
          const salesOrder = await salesOrdersRepository.findById(
            salesOrderIdForUpdate
          );
          const receiptSent = await sendReceiptAndMarkSent(
            updatedPayment,
            salesOrder
          );
          if (receiptSent) {
            console.log(`  ✅ Receipt email sent successfully`);
          } else {
            console.log(`  ⚠️  Receipt email not sent (may already be sent)`);
          }
        } catch (receiptError) {
          // Log error and emit error event for frontend notification
          console.error("❌ Failed to send receipt email:", receiptError);
          try {
            const { emitPaymentError } =
              await import("../../salesOrders/sockets/salesOrders.js");
            emitPaymentError(
              salesOrderIdForUpdate,
              "receipt_send_failed",
              "Payment succeeded but failed to send receipt email. You can manually send it from the payment details.",
              { paymentId: payment._id, error: receiptError.message }
            );
          } catch (emitError) {
            console.error("Failed to emit payment error event:", emitError);
          }
        }
      } else {
        console.log(
          `  ⚠️  Payment not found for payment intent ${paymentIntent.id}`
        );
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const payment = await paymentsRepository.findByStripePaymentIntentId(
        paymentIntent.id
      );

      if (payment) {
        const errorMessage =
          paymentIntent.last_payment_error?.message || "Payment failed";

        try {
          await paymentsRepository.updateById(payment._id, {
            status: "failed",
            errorMessage,
          });

          // Get sales order ID to emit error event
          const salesOrderIdForUpdate =
            typeof payment.salesOrder === "object" && payment.salesOrder?._id
              ? payment.salesOrder._id
              : payment.salesOrder;

          if (salesOrderIdForUpdate) {
            // Emit error event for frontend notification
            try {
              const { emitPaymentError } =
                await import("../../salesOrders/sockets/salesOrders.js");
              emitPaymentError(
                salesOrderIdForUpdate,
                "payment_failed",
                `Payment failed: ${errorMessage}`,
                { paymentId: payment._id, paymentIntentId: paymentIntent.id }
              );
            } catch (emitError) {
              console.error("Failed to emit payment error event:", emitError);
            }
          }
        } catch (updateError) {
          console.error(
            "❌ Error updating payment status to failed:",
            updateError
          );
          // Emit error event for frontend notification
          try {
            const salesOrderIdForUpdate =
              typeof payment.salesOrder === "object" && payment.salesOrder?._id
                ? payment.salesOrder._id
                : payment.salesOrder;
            if (salesOrderIdForUpdate) {
              const { emitPaymentError } =
                await import("../../salesOrders/sockets/salesOrders.js");
              emitPaymentError(
                salesOrderIdForUpdate,
                "payment_status_update_failed",
                "Payment failed but status update encountered an error. Please refresh the page.",
                { paymentId: payment._id, error: updateError.message }
              );
            }
          } catch (emitError) {
            console.error("Failed to emit payment error event:", emitError);
          }
        }
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;

      // Find payment by charge ID
      const payment = await paymentsRepository.findByStripeChargeId(charge.id);

      if (!payment) {
        // Payment not found - might have been refunded outside of our system
        // or charge ID doesn't match. Try to find by payment intent if available.
        if (charge.payment_intent) {
          const paymentByIntent =
            await paymentsRepository.findByStripePaymentIntentId(
              charge.payment_intent
            );

          if (paymentByIntent) {
            // Update charge ID if missing and process refund
            if (!paymentByIntent.stripeChargeId) {
              await paymentsRepository.updateById(paymentByIntent._id, {
                stripeChargeId: charge.id,
              });
            }

            // Process refund for this payment
            const amountRefundedInDollars = centsToDollars(
              charge.amount_refunded || 0
            );
            const paymentAmount = paymentByIntent.amount;

            // Update payment record
            const newRefundedAmount = min(
              amountRefundedInDollars,
              paymentAmount
            );
            const newStatus =
              newRefundedAmount >= paymentAmount
                ? "refunded"
                : "partially_refunded";

            await paymentsRepository.updateById(paymentByIntent._id, {
              refundedAmount: newRefundedAmount,
              status: newStatus,
            });

            // Get the updated payment with populated fields
            const updatedPayment = await paymentsRepository.findById(
              paymentByIntent._id
            );

            // Get sales order ID
            const salesOrderIdForUpdate =
              typeof updatedPayment.salesOrder === "object" &&
              updatedPayment.salesOrder?._id
                ? updatedPayment.salesOrder._id
                : updatedPayment.salesOrder;

            if (salesOrderIdForUpdate) {
              // Emit socket event for payment update
              try {
                const { emitPaymentUpdated } =
                  await import("../../salesOrders/sockets/salesOrders.js");
                emitPaymentUpdated(salesOrderIdForUpdate, updatedPayment);
              } catch (error) {
                console.error("Failed to emit paymentUpdated event:", error);
              }

              // Update sales order payment totals
              await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);
            }
          }
        }
        break;
      }

      // Payment found by charge ID - process refund update
      // Use nullish coalescing to preserve 0 values
      const amountRefundedInDollars = centsToDollars(
        charge.amount_refunded ?? 0
      );
      const paymentAmount = payment.amount;

      // Only update if the refunded amount has changed (prevent duplicate processing)
      // Use nullish coalescing to preserve 0 values
      const currentRefundedAmount = payment.refundedAmount ?? 0;
      if (
        abs(subtract(amountRefundedInDollars, currentRefundedAmount)) < 0.01
      ) {
        // Refund amount hasn't changed, likely already processed
        break;
      }

      // Update payment record
      const newRefundedAmount = min(amountRefundedInDollars, paymentAmount);
      const newStatus =
        newRefundedAmount >= paymentAmount ? "refunded" : "partially_refunded";

      await paymentsRepository.updateById(payment._id, {
        refundedAmount: newRefundedAmount,
        status: newStatus,
      });

      // Get the updated payment with populated fields
      const updatedPayment = await paymentsRepository.findById(payment._id);

      // Get sales order ID
      const salesOrderIdForUpdate =
        typeof updatedPayment.salesOrder === "object" &&
        updatedPayment.salesOrder?._id
          ? updatedPayment.salesOrder._id
          : updatedPayment.salesOrder;

      if (salesOrderIdForUpdate) {
        // Emit socket event for payment update
        try {
          const { emitPaymentUpdated } =
            await import("../../salesOrders/sockets/salesOrders.js");
          emitPaymentUpdated(salesOrderIdForUpdate, updatedPayment);
        } catch (error) {
          console.error("Failed to emit paymentUpdated event:", error);
        }

        // Update sales order payment totals
        await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);
      }

      break;
    }

    default:
      // Unhandled event type
      break;
  }
};
