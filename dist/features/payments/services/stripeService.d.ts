import Stripe from "stripe";
declare const getStripeClient: () => Stripe;
/**
 * Calculate order total from products array
 */
export declare const calculateOrderTotal: (products: any) => any;
/**
 * Create or retrieve Stripe Customer
 */
export declare const createOrGetStripeCustomer: (email: any, name: any, metadata?: {}) => Promise<Stripe.Customer>;
/**
 * Retrieve Payment Link from Stripe
 */
export declare const retrievePaymentLink: (paymentLinkId: any) => Promise<{
    paymentLinkId: string;
    url: string;
    active: boolean;
}>;
/**
 * Create Payment Link for invoice
 */
export declare const createPaymentLink: ({ amount, currency, description, metadata, customerEmail, customerName, returnUrl, }: {
    amount: any;
    currency?: string;
    description: any;
    metadata?: {};
    customerEmail: any;
    customerName: any;
    returnUrl: any;
}) => Promise<{
    paymentLinkId: string;
    url: string;
}>;
/**
 * Create Payment Intent for charging saved card
 */
export declare const createPaymentIntent: ({ amount, currency, customerId, paymentMethodId, description, metadata, savePaymentMethod, }: {
    amount: any;
    currency?: string;
    customerId: any;
    paymentMethodId: any;
    description: any;
    metadata?: {};
    savePaymentMethod?: boolean;
}) => Promise<Stripe.Response<Stripe.PaymentIntent>>;
/**
 * Attach payment method to customer
 */
export declare const attachPaymentMethodToCustomer: (paymentMethodId: any, customerId: any) => Promise<Stripe.Response<Stripe.PaymentMethod>>;
/**
 * Create Setup Intent for saving card without charging
 */
export declare const createSetupIntent: (customerId: any) => Promise<Stripe.Response<Stripe.SetupIntent>>;
/**
 * Retrieve Payment Intent
 */
export declare const retrievePaymentIntent: (paymentIntentId: any) => Promise<Stripe.Response<Stripe.PaymentIntent>>;
/**
 * Retrieve Payment Method
 */
export declare const retrievePaymentMethod: (paymentMethodId: any) => Promise<Stripe.Response<Stripe.PaymentMethod>>;
/**
 * Process Refund
 */
export declare const processRefund: ({ chargeId, paymentIntentId, amount, reason, metadata, }: {
    chargeId: any;
    paymentIntentId?: any;
    amount?: any;
    reason?: string;
    metadata?: {};
}) => Promise<Stripe.Response<Stripe.Refund>>;
/**
 * Retrieve Charge
 */
export declare const retrieveCharge: (chargeId: any) => Promise<Stripe.Response<Stripe.Charge>>;
/**
 * List customer payment methods
 */
export declare const listCustomerPaymentMethods: (customerId: any) => Promise<Stripe.PaymentMethod[]>;
/**
 * Detach (delete) payment method from customer
 */
export declare const detachPaymentMethodFromCustomer: (paymentMethodId: any) => Promise<Stripe.Response<Stripe.PaymentMethod>>;
export { getStripeClient as stripe };
//# sourceMappingURL=stripeService.d.ts.map