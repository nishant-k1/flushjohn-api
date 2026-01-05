/**
 * Graceful shutdown - close browser pool
 */
export declare const closeBrowserPool: () => Promise<void>;
/**
 * Generate PDF using Playwright/Puppeteer with browser pooling and upload to S3
 *
 * OPTIMIZATION: Uses browser pool to reuse browser instance across PDF generations
 * - Browser launch takes 2-4 seconds, reusing saves this time
 * - Each PDF gets a fresh context/page with fresh data (no stale content)
 * - Browser auto-closes after 5 minutes of inactivity
 *
 * @param {Object} documentData - Document data from request body
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
 * @param {string} documentId - Document ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export declare const generatePDF: (documentData: any, documentType: any, documentId: any) => Promise<{
    pdfUrl: string;
}>;
/**
 * Generate PDF for Quote
 * @param {Object} quoteData - Quote data from request body
 * @param {string} quoteId - Quote ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export declare const generateQuotePDF: (quoteData: any, quoteId: any) => Promise<{
    pdfUrl: string;
}>;
/**
 * Generate PDF for Sales Order
 * @param {Object} salesOrderData - Sales Order data from request body
 * @param {string} salesOrderId - Sales Order ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export declare const generateSalesOrderPDF: (salesOrderData: any, salesOrderId: any) => Promise<{
    pdfUrl: string;
}>;
/**
 * Generate PDF for Job Order
 * @param {Object} jobOrderData - Job Order data from request body
 * @param {string} jobOrderId - Job Order ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export declare const generateJobOrderPDF: (jobOrderData: any, jobOrderId: any) => Promise<{
    pdfUrl: string;
}>;
//# sourceMappingURL=pdfService.d.ts.map