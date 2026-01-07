import Stripe from "stripe";
import {
  dollarsToCents,
  centsToDollars,
} from "../../../utils/priceCalculations.js";

/**
 * Stripe Service
 * Handles all Stripe payment operations
 */

// Lazy initialization to ensure environment variables are loaded
let stripe: Stripe | null = null;

const getStripeClient = (): Stripe => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY environment variable is required for Stripe operations"
      );
    }
    stripe = new Stripe(secretKey, {
      apiVersion: "2024-12-18.acacia" as any,
    });
  }
  return stripe;
};

/**
 * Convert amount to cents (Stripe uses smallest currency unit)
 * Improved version: handles both number and string, validates input
 * For best accuracy, use calculateOrderTotalCents() directly when possible
 */
const amountToCents = (amount: number | string): number => {
  // If already a string from calculateProductAmount, parse it
  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;

  // Validate input
  if (isNaN(amountNum) || !Number.isFinite(amountNum)) {
    throw new Error(`Invalid amount for Stripe conversion: ${amount}`);
  }
  if (amountNum < 0) {
    throw new Error(`Amount cannot be negative: ${amount}`);
  }

  // Use utility function for currency conversion
  const cents = dollarsToCents(amountNum);

  // Validate result
  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error(`Invalid cents value after conversion: ${cents}`);
  }

  return cents;
};

/**
 * Convert cents to amount
 */
const centsToAmount = (cents) => {
  return centsToDollars(cents);
};

/**
 * Create or retrieve Stripe Customer
 */
export const createOrGetStripeCustomer = async (email, name, metadata = {}) => {
  try {
    const stripe = getStripeClient();
    // Check if customer exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error) {
    console.error("Error creating/getting Stripe customer:", error);
    throw new Error(`Failed to create/get Stripe customer: ${error.message}`);
  }
};

/**
 * Retrieve Payment Link from Stripe
 */
export const retrievePaymentLink = async (paymentLinkId) => {
  try {
    const stripe = getStripeClient();
    const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
    return {
      paymentLinkId: paymentLink.id,
      url: paymentLink.url,
      active: paymentLink.active,
    };
  } catch (error) {
    console.error("Error retrieving payment link:", error);
    throw new Error(`Failed to retrieve payment link: ${error.message}`);
  }
};

/**
 * Create Payment Link for invoice
 */
export const createPaymentLink = async ({
  amount,
  currency = "usd",
  description,
  metadata = {},
  customerEmail,
  customerName,
  returnUrl,
}) => {
  try {
    const stripe = getStripeClient();
    // Ensure amount is in cents
    const amountInCents = amountToCents(amount);

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: description || "Invoice Payment",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        } as any,
      ],
      metadata: {
        ...metadata,
        description: description || "",
        // Store expiration timestamp in metadata for cron job tracking
        expiresAt: (
          await import("../../../utils/invoiceExpirationCalculations.js")
        ).calculateInvoiceExpirationISO(),
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url:
            returnUrl ||
            process.env.PAYMENT_SUCCESS_URL ||
            "https://example.com/success",
        },
      },
    });

    return {
      paymentLinkId: paymentLink.id,
      url: paymentLink.url,
    };
  } catch (error) {
    console.error("Error creating payment link:", error);
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
};

/**
 * Create Payment Intent for charging saved card
 */
export const createPaymentIntent = async ({
  amount,
  currency = "usd",
  customerId,
  paymentMethodId,
  description,
  metadata = {},
  savePaymentMethod = false,
}) => {
  try {
    const stripe = getStripeClient();
    const amountInCents = amountToCents(amount);

    const paymentIntentData = {
      amount: amountInCents,
      currency,
      description,
      metadata,
      confirm: true,
      // Only accept card payments (no redirect-based methods)
      payment_method_types: ["card"],
    };

    if (customerId) {
      (paymentIntentData as any).customer = customerId;
    }

    if (paymentMethodId) {
      (paymentIntentData as any).payment_method = paymentMethodId;
    }

    if (savePaymentMethod && customerId) {
      (paymentIntentData as any).setup_future_usage = "off_session";
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

/**
 * Attach payment method to customer
 */
export const attachPaymentMethodToCustomer = async (
  paymentMethodId,
  customerId
) => {
  try {
    const stripe = getStripeClient();
    // First, check if the payment method is already attached to this customer
    try {
      const existingMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });
      const isAlreadyAttached = existingMethods.data.some(
        (pm) => pm.id === paymentMethodId
      );

      if (isAlreadyAttached) {
        // Payment method is already attached, return it without re-attaching
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );
        return paymentMethod;
      }
    } catch (checkError) {
      // If check fails, proceed with attach (will error if already attached)
      console.warn("Failed to check existing payment methods:", checkError);
    }

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if no default payment method exists
    const customer = await stripe.customers.retrieve(customerId);
    if (!(customer as any).invoice_settings?.default_payment_method) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return paymentMethod;
  } catch (error) {
    // If error is "already attached", that's okay - just return the existing payment method
    if (
      error.type === "StripeInvalidRequestError" &&
      (error.code === "resource_already_exists" ||
        error.message?.includes("already attached"))
    ) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );
        return paymentMethod;
      } catch (retrieveError) {
        console.error(
          "Error retrieving payment method after duplicate attach:",
          retrieveError
        );
        throw new Error(`Payment method is already attached`);
      }
    }
    console.error("Error attaching payment method:", error);
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
};

/**
 * Create Setup Intent for saving card without charging
 */
export const createSetupIntent = async (customerId) => {
  try {
    const stripe = getStripeClient();
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    return setupIntent;
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw new Error(`Failed to create setup intent: ${error.message}`);
  }
};

/**
 * Retrieve Payment Intent
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
};

/**
 * Retrieve Payment Method
 */
export const retrievePaymentMethod = async (paymentMethodId) => {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    console.error("Error retrieving payment method:", error);
    throw new Error(`Failed to retrieve payment method: ${error.message}`);
  }
};

/**
 * Process Refund
 */
export const processRefund = async ({
  chargeId,
  paymentIntentId = null, // Optional: can refund via payment intent if charge ID not available
  amount = null, // null = full refund, otherwise partial refund
  reason = "requested_by_customer",
  metadata = {},
}) => {
  try {
    const stripe = getStripeClient();
    const refundData = {
      metadata,
    };

    // Use charge ID if available, otherwise use payment intent ID
    if (chargeId) {
      (refundData as any).charge = chargeId;
    } else if (paymentIntentId) {
      (refundData as any).payment_intent = paymentIntentId;
    } else {
      throw new Error("Either chargeId or paymentIntentId must be provided");
    }

    if (amount !== null) {
      (refundData as any).amount = amountToCents(amount);
    }

    const refund = await stripe.refunds.create(refundData);

    return refund;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Retrieve Charge
 */
export const retrieveCharge = async (chargeId) => {
  try {
    const stripe = getStripeClient();
    return await stripe.charges.retrieve(chargeId);
  } catch (error) {
    console.error("Error retrieving charge:", error);
    throw new Error(`Failed to retrieve charge: ${error.message}`);
  }
};

/**
 * List customer payment methods
 */
export const listCustomerPaymentMethods = async (customerId) => {
  try {
    const stripe = getStripeClient();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return paymentMethods.data;
  } catch (error) {
    console.error("Error listing payment methods:", error);
    throw new Error(`Failed to list payment methods: ${error.message}`);
  }
};

/**
 * Detach (delete) payment method from customer
 */
export const detachPaymentMethodFromCustomer = async (paymentMethodId) => {
  try {
    const stripe = getStripeClient();
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error("Error detaching payment method:", error);
    throw new Error(`Failed to detach payment method: ${error.message}`);
  }
};

// Export getter function for backward compatibility
// Note: Direct stripe export removed - use getStripeClient() internally
export { getStripeClient };
