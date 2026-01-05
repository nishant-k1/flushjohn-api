/**
 * Send Sales Receipt Email
 * Sends receipt email after successful payment
 */
/**
 * Send sales receipt email after successful payment
 * @param {Object} payment - Payment document
 * @param {Object} salesOrder - Sales Order document (optional, will fetch if not provided)
 * @returns {Promise<boolean>} - Success status
 */
export declare const sendSalesReceiptEmail: (payment: any, salesOrder?: any) => Promise<boolean>;
//# sourceMappingURL=sendReceiptEmail.d.ts.map