/**
 * Graceful shutdown - close all transporters
 */
export declare const closeEmailPool: () => void;
/**
 * Send email with PDF attachment from S3
 *
 * OPTIMIZATION: Uses pooled SMTP connections for faster email sending
 * - First email takes normal time (establishes connection)
 * - Subsequent emails reuse connection (50%+ faster)
 *
 * @param {Object} documentData - Document data
 * @param {string} documentType - 'quote', 'salesOrder', 'invoice', or 'jobOrder'
 * @param {string} documentId - Document ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @returns {Promise<boolean>} - Success status
 */
export declare const sendEmailWithS3PDF: (documentData: any, documentType: any, documentId: any, s3PdfUrl: any) => Promise<boolean>;
/**
 * Send Quote Email
 * @param {Object} quoteData - Quote data
 * @param {string} quoteId - Quote ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @returns {Promise<boolean>} - Success status
 */
export declare const sendQuoteEmail: (quoteData: any, quoteId: any, s3PdfUrl: any) => Promise<boolean>;
/**
 * Send Sales Order Email
 * @param {Object} salesOrderData - Sales Order data
 * @param {string} salesOrderId - Sales Order ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @param {string} paymentLinkUrl - Optional payment link URL
 * @returns {Promise<boolean>} - Success status
 */
export declare const sendSalesOrderEmail: (salesOrderData: any, salesOrderId: any, s3PdfUrl: any, paymentLinkUrl?: any) => Promise<boolean>;
/**
 * Send Job Order Email
 * @param {Object} jobOrderData - Job Order data
 * @param {string} jobOrderId - Job Order ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @returns {Promise<boolean>} - Success status
 */
export declare const sendJobOrderEmail: (jobOrderData: any, jobOrderId: any, s3PdfUrl: any) => Promise<boolean>;
/**
 * Send Invoice Email (with payment link)
 * @param {Object} invoiceData - Invoice/Sales Order data
 * @param {string} salesOrderId - Sales Order ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @param {string} paymentLinkUrl - Payment link URL (required for invoice)
 * @returns {Promise<boolean>} - Success status
 */
export declare const sendInvoiceEmail: (invoiceData: any, salesOrderId: any, s3PdfUrl: any, paymentLinkUrl: any) => Promise<boolean>;
//# sourceMappingURL=emailService.d.ts.map