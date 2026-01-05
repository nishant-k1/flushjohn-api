/**
 * Quote AI Rate Service - AI-powered rate suggestions for quotes
 */
/**
 * Get AI suggested rate for a product in a quote based on location and historical data
 * @param {Object} params - Rate parameters
 * @param {string} params.zipCode - Zip code
 * @param {string} params.city - City
 * @param {string} params.state - State
 * @param {string} params.streetAddress - Street address (optional)
 * @param {string} params.productItem - Product/item name
 * @param {number} params.quantity - Quantity needed
 * @param {string} params.usageType - Usage type (construction, event, etc.) - optional
 * @returns {Object} - AI suggested rate with confidence level
 */
export declare const getAISuggestedRate: ({ zipCode, city, state, streetAddress, productItem, quantity, usageType, }: {
    zipCode: any;
    city: any;
    state: any;
    streetAddress: any;
    productItem: any;
    quantity?: number;
    usageType: any;
}) => Promise<{
    suggestedRatePerUnit: number;
    vendorCostEstimate: number;
    margin: number;
    confidence: any;
    reasoning: any;
    dataSources: {
        historicalSamples: number;
        hasVendorPricing: boolean;
        hasJobOrders: boolean;
        hasSalesOrders: boolean;
        hasQuotes: boolean;
    };
}>;
//# sourceMappingURL=quoteAIRateService.d.ts.map