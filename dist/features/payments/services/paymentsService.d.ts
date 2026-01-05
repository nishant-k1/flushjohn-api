/**
 * Payments Service
 * Business logic for payment operations
 */
/**
 * Calculate and update sales order payment totals
 */
export declare const updateSalesOrderPaymentTotals: (salesOrderId: any) => Promise<{
    orderTotal: any;
    paidAmount: number;
    balanceDue: number;
    paymentStatus: string;
}>;
/**
 * Create payment link for sales order (reuses existing pending payment link if available)
 */
export declare const createSalesOrderPaymentLink: (salesOrderId: any, returnUrl: any) => Promise<{
    paymentId: any;
    paymentLinkId: any;
    url: string;
}>;
/**
 * Charge saved card or new card
 */
export declare const chargeSalesOrder: (salesOrderId: any, { paymentMethodId, saveCard, customerId }: {
    paymentMethodId: any;
    saveCard?: boolean;
    customerId?: any;
}) => Promise<{
    paymentId: any;
    paymentIntentId: string;
    status: import("stripe").Stripe.PaymentIntent.Status;
    clientSecret: string;
    requiresAction: boolean;
}>;
/**
 * Process refund for payment
 */
export declare const refundPayment: (paymentId: any, refundAmount?: any, reason?: string) => Promise<{
    refundId: string;
    amount: number;
    status: string;
    paymentStatus: string;
}>;
/**
 * Get payment by ID
 */
export declare const getPaymentById: (paymentId: any) => Promise<any>;
/**
 * Get payments for sales order
 */
/**
 * Get saved payment methods for a customer
 */
export declare const getCustomerPaymentMethods: (stripeCustomerId: any) => Promise<{
    id: string;
    type: import("stripe").Stripe.PaymentMethod.Type;
    card: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
    };
    created: number;
}[]>;
/**
 * Save payment method for customer (without charging)
 */
export declare const savePaymentMethod: (salesOrderId: any, { paymentMethodId, customerId }: {
    paymentMethodId: any;
    customerId?: any;
}) => Promise<{
    stripeCustomerId: any;
    paymentMethodId: any;
}>;
/**
 * Delete payment method for customer
 */
export declare const deletePaymentMethod: (paymentMethodId: any) => Promise<{
    success: boolean;
}>;
export declare const getPaymentsBySalesOrder: (salesOrderId: any) => Promise<any>;
/**
 * Manually send payment receipt email
 * Can be called multiple times for the same payment
 */
export declare const sendPaymentReceipt: (paymentId: any) => Promise<{
    success: boolean;
}>;
/**
 * Sync payment link status from Stripe
 * Checks Stripe directly to see if payment link has been paid and updates status
 */
export declare const syncPaymentLinkStatus: (paymentId: any) => Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Cancel a pending payment link
 * Only cancels payment links (not card payments)
 */
export declare const cancelPaymentLink: (paymentId: any) => Promise<{
    success: boolean;
}>;
/**
 * Handle Stripe webhook event
 */
export declare const handleStripeWebhook: (event: any) => Promise<void>;
//# sourceMappingURL=paymentsService.d.ts.map