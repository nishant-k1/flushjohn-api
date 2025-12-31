import * as paymentsRepository from "../repositories/paymentsRepository.js";
import * as salesOrdersRepository from "../../salesOrders/repositories/salesOrdersRepository.js";
import * as salesOrdersService from "../../salesOrders/services/salesOrdersService.js";
import {
  createPaymentLink,
  createPaymentIntent,
  createOrGetStripeCustomer,
  attachPaymentMethodToCustomer,
  retrievePaymentIntent,
  retrievePaymentMethod,
  processRefund,
  retrieveCharge,
  calculateOrderTotal,
  listCustomerPaymentMethods,
} from "./stripeService.js";

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

  // Calculate order total from products
  const orderTotal = calculateOrderTotal(salesOrder.products);

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
      totalPaid += payment.amount;
      // Add any refunded amount (0 for succeeded, amount for refunded, partial for partially_refunded)
      totalRefunded += payment.refundedAmount || 0;
    }
  });

  // Net paid amount cannot be negative (enforced by schema min: 0)
  const netPaidAmount = Math.max(0, totalPaid - totalRefunded);
  const balanceDue = Math.max(0, orderTotal - netPaidAmount);

  // Determine payment status
  let paymentStatus = "Unpaid";
  if (netPaidAmount >= orderTotal) {
    paymentStatus = totalRefunded > 0 ? "Refunded" : "Paid";
  } else if (netPaidAmount > 0) {
    paymentStatus = "Partially Paid";
  }

  // Update sales order
  await salesOrdersRepository.updateById(salesOrderId, {
    orderTotal,
    paidAmount: netPaidAmount,
    balanceDue,
    paymentStatus,
  });

  return {
    orderTotal,
    paidAmount: netPaidAmount,
    balanceDue,
    paymentStatus,
  };
};

/**
 * Create payment link for sales order
 */
export const createSalesOrderPaymentLink = async (salesOrderId, returnUrl) => {
  const salesOrder = await salesOrdersRepository.findById(salesOrderId);
  if (!salesOrder) {
    throw new Error("Sales Order not found");
  }

  // Calculate order total
  const orderTotal = calculateOrderTotal(salesOrder.products);
  if (orderTotal <= 0) {
    throw new Error("Order total must be greater than 0");
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

  // Create payment link
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

  // Calculate order total
  const orderTotal = calculateOrderTotal(salesOrder.products);
  if (orderTotal <= 0) {
    throw new Error("Order total must be greater than 0");
  }

  // Check for existing pending or succeeded payment with the same payment intent to prevent duplicates
  // This prevents double-charging if the API is called multiple times
  const existingPayments = await paymentsRepository.findAll({
    query: {
      salesOrder: salesOrderId,
      status: { $in: ["pending", "succeeded"] },
    },
    sort: { createdAt: -1 },
    skip: 0,
    limit: 1,
  });

  // If there's a very recent payment (within last 5 seconds), prevent duplicate
  if (existingPayments.length > 0) {
    const recentPayment = existingPayments[0];
    const timeSinceCreation = Date.now() - new Date(recentPayment.createdAt).getTime();
    if (timeSinceCreation < 5000) {
      // Very recent payment, likely a duplicate request
      throw new Error(
        "A payment is already being processed for this order. Please wait a moment."
      );
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
    paymentIntent.charges?.data?.[0]
  ) {
    const charge = paymentIntent.charges.data[0];
    if (charge.payment_method_details?.card && !cardLast4) {
      const card = charge.payment_method_details.card;
      cardLast4 = card.last4;
      cardBrand = card.brand;
    }
  }

  // Get charge ID if payment succeeded
  const chargeId =
    (paymentIntent.status === "succeeded" &&
      paymentIntent.charges?.data?.[0]?.id) ||
    null;

  // Create payment record
  const payment = await paymentsRepository.create({
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

  // If payment succeeded immediately, the webhook will handle the rest
  // We only update sales order totals here, and let the webhook handle email sending
  // This prevents duplicate processing when both immediate response and webhook fire
  if (paymentIntent.status === "succeeded") {
    // Update sales order with Stripe customer ID if not already set
    if (!salesOrder.stripeCustomerId) {
      await salesOrdersRepository.updateById(salesOrderId, {
        stripeCustomerId,
      });
    }

    // Update totals - webhook will also do this, but it's idempotent
    // The webhook is the source of truth, so we update here for immediate UI feedback
    await updateSalesOrderPaymentTotals(salesOrderId);

    // Note: Receipt email is sent only via webhook to prevent duplicates
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
        paymentIntent.charges?.data?.[0]?.id
      ) {
        chargeId = paymentIntent.charges.data[0].id;
        
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

  // Check available amount to refund
  const availableToRefund = payment.amount - (payment.refundedAmount || 0);
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
  const newRefundedAmount =
    (payment.refundedAmount || 0) + refundAmountToProcess;
  const newStatus =
    newRefundedAmount >= payment.amount ? "refunded" : "partially_refunded";

  await paymentsRepository.updateById(paymentId, {
    refundedAmount: newRefundedAmount,
    status: newStatus,
  });

  // Update sales order payment totals
  await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);

  return {
    refundId: refund.id,
    amount: refund.amount / 100, // Convert from cents
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
    const { detachPaymentMethodFromCustomer } = await import(
      "../services/stripeService.js"
    );
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
 * Handle Stripe webhook event
 */
export const handleStripeWebhook = async (event) => {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const payment = await paymentsRepository.findByStripePaymentIntentId(
        paymentIntent.id
      );

      if (payment) {
        // Only process if payment is not already succeeded (prevent duplicate processing)
        if (payment.status === "succeeded") {
          console.log(
            `Payment ${payment._id} already marked as succeeded, skipping webhook processing`
          );
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

        await paymentsRepository.updateById(payment._id, {
          status: "succeeded",
          stripeChargeId: chargeId,
          cardLast4,
          cardBrand,
        });

        // Get sales order ID (handle both populated and unpopulated cases)
        const salesOrderIdForUpdate =
          typeof payment.salesOrder === "object" && payment.salesOrder?._id
            ? payment.salesOrder._id
            : payment.salesOrder;

        await updateSalesOrderPaymentTotals(salesOrderIdForUpdate);

        // Send sales receipt email (only once via webhook)
        try {
          const { sendSalesReceiptEmail } = await import(
            "./sendReceiptEmail.js"
          );
          const updatedPayment = await paymentsRepository.findById(payment._id);
          const salesOrder = await salesOrdersRepository.findById(
            salesOrderIdForUpdate
          );
          await sendSalesReceiptEmail(updatedPayment, salesOrder);
        } catch (receiptError) {
          // Log error but don't fail the webhook processing
          console.error("Failed to send receipt email:", receiptError);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const payment = await paymentsRepository.findByStripePaymentIntentId(
        paymentIntent.id
      );

      if (payment) {
        await paymentsRepository.updateById(payment._id, {
          status: "failed",
          errorMessage:
            paymentIntent.last_payment_error?.message || "Payment failed",
        });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;
      // Handle refund webhook - payment status is updated via refundPayment function
      break;
    }

    default:
      // Unhandled event type
      break;
  }
};
