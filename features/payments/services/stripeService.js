import Stripe from "stripe";

/**
 * Stripe Service
 * Handles all Stripe payment operations
 */

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

/**
 * Calculate order total from products array
 */
export const calculateOrderTotal = (products) => {
  if (!products || !Array.isArray(products)) {
    return 0;
  }
  return products.reduce((total, product) => {
    const qty = parseFloat(product.qty) || 0;
    const rate = parseFloat(product.rate) || 0;
    return total + qty * rate;
  }, 0);
};

/**
 * Convert amount to cents (Stripe uses smallest currency unit)
 */
const amountToCents = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Convert cents to amount
 */
const centsToAmount = (cents) => {
  return cents / 100;
};

/**
 * Create or retrieve Stripe Customer
 */
export const createOrGetStripeCustomer = async (email, name, metadata = {}) => {
  try {
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
        },
      ],
      metadata: {
        ...metadata,
        description: description || "",
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
      paymentIntentData.customer = customerId;
    }

    if (paymentMethodId) {
      paymentIntentData.payment_method = paymentMethodId;
    }

    if (savePaymentMethod && customerId) {
      paymentIntentData.setup_future_usage = "off_session";
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
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if no default payment method exists
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.invoice_settings.default_payment_method) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return paymentMethod;
  } catch (error) {
    console.error("Error attaching payment method:", error);
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
};

/**
 * Create Setup Intent for saving card without charging
 */
export const createSetupIntent = async (customerId) => {
  try {
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
    const refundData = {
      metadata,
    };

    // Use charge ID if available, otherwise use payment intent ID
    if (chargeId) {
      refundData.charge = chargeId;
    } else if (paymentIntentId) {
      refundData.payment_intent = paymentIntentId;
    } else {
      throw new Error("Either chargeId or paymentIntentId must be provided");
    }

    if (amount !== null) {
      refundData.amount = amountToCents(amount);
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
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error("Error detaching payment method:", error);
    throw new Error(`Failed to detach payment method: ${error.message}`);
  }
};

export { stripe };
