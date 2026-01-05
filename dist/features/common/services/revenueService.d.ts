/**
 * Revenue Calculation Service
 * Calculates total revenue based on sales orders, job orders, and expenses
 */
/**
 * Calculate revenue for a given date range
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @param {number} vendorTransactionCharges - Vendor transaction charges (percentage or dollar amount)
 * @param {string} vendorTransactionChargesMode - "percentage" or "dollar"
 * @param {number} googleAdsSpending - Google Ads spending
 * @param {number} facebookAdsSpending - Facebook Ads spending
 * @param {number} instagramAdsSpending - Instagram Ads spending
 * @param {number} linkedInAdsSpending - LinkedIn Ads spending
 * @param {number} othersExpenses - Other custom expenses
 * @returns {Promise<Object>} Revenue calculation result
 */
export declare const calculateRevenue: ({ startDate, endDate, vendorTransactionCharges, vendorTransactionChargesMode, googleAdsSpending, facebookAdsSpending, instagramAdsSpending, linkedInAdsSpending, othersExpenses, }: {
    startDate: any;
    endDate: any;
    vendorTransactionCharges?: number;
    vendorTransactionChargesMode?: string;
    googleAdsSpending?: number;
    facebookAdsSpending?: number;
    instagramAdsSpending?: number;
    linkedInAdsSpending?: number;
    othersExpenses?: number;
}) => Promise<{
    totalRevenue: number;
    salesOrderCount: number;
    jobOrderCount: number;
    salesOrderRevenues: any[];
    adsTotal: number;
    dateRange: {
        start: string;
        end: string;
    };
}>;
//# sourceMappingURL=revenueService.d.ts.map