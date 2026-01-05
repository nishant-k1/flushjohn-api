/**
 * Sales Assist Service - AI-powered sales assistance business logic
 */
/**
 * Analyze conversation transcript to extract intent and key information
 * Also identifies speaker roles (Operator vs Customer) based on conversation context
 * @param {string} transcript - The conversation transcript
 * @param {Object} context - Additional context (operator name, etc.)
 * @returns {Object} - Extracted information and intent
 */
export declare const analyzeConversation: (transcript: any, context?: {}) => Promise<{
    intent: any;
    location: any;
    eventType: any;
    quantity: any;
    dates: any;
    questions: any;
    tone: any;
    summary: any;
}>;
/**
 * Get vendor pricing based on location and event details
 * @param {Object} params - Location and event parameters
 * @returns {Object} - Vendor pricing information
 */
export declare const getVendorPricing: ({ zipCode, city, state, eventType, quantity, productItem, }: {
    zipCode: any;
    city: any;
    state: any;
    eventType: any;
    quantity?: number;
    productItem?: string;
}) => Promise<{
    vendors: any[];
    averagePrice: any;
    recommendedPrice: any;
    message: string;
    vendorBasePrice?: undefined;
    margin?: undefined;
    marginAmount?: undefined;
    quantity?: undefined;
    historicalData?: undefined;
    aiSuggestedRate?: undefined;
} | {
    vendors: {
        id: any;
        name: any;
        city: any;
        state: any;
        zip: any;
        phone: any;
        email: any;
    }[];
    averagePrice: number;
    vendorBasePrice: number;
    margin: number;
    marginAmount: number;
    recommendedPrice: number;
    quantity: number;
    message: string;
    historicalData: {
        sampleSize: number;
        isHistoricalData: boolean;
        message: string;
    };
    aiSuggestedRate: {
        suggestedRatePerUnit: any;
        confidence: any;
        reasoning: any;
    };
}>;
/**
 * Generate a suggested response for the operator
 * @param {Object} params - Response generation parameters
 * @returns {Object} - Suggested response
 */
export declare const generateResponseSuggestion: ({ customerQuery, extractedInfo, pricing, }: {
    customerQuery: any;
    extractedInfo: any;
    pricing: any;
}) => Promise<{
    suggestedResponse: any;
    keyPoints: any[];
}>;
/**
 * Submit actual vendor quote to improve pricing accuracy
 * @param {Object} quoteData - Vendor quote information
 * @returns {Object} - Saved quote with comparison data
 */
export declare const submitVendorQuote: (quoteData: any) => Promise<{
    comparison: {
        suggestedPrice: any;
        actualPrice: any;
        difference: any;
        accuracy: number;
        message: string;
    };
    vendorId: any;
    vendorName: any;
    zipCode: any;
    city: any;
    state: any;
    eventType: any;
    quantity: any;
    pricePerUnit: any;
    totalPrice: any;
    additionalCharges: any;
    quotedBy: any;
    notes: any;
    source: any;
    aiSuggestedPrice: any;
    priceDifference: any;
    accuracyRating: any;
    quotedDate: import("dayjs").Dayjs;
    id: any;
}>;
/**
 * Generate vendor call suggestions based on lead data
 * Provides AI-generated conversation guide for calling vendors
 * @param {String} leadId - Lead ID to fetch from database
 * @returns {Object} - Vendor call suggestions and script
 */
export declare const generateVendorCallSuggestions: (leadId: any) => Promise<{
    openingStatement: any;
    questions: any;
    pricingPoints: any;
    negotiationTips: any;
    closingStatement: any;
}>;
/**
 * Generate real-time response for operator to read aloud
 * This is the core function for the AI Sales Assistant
 * @param {Object} params - Parameters for response generation
 * @param {string} params.mode - "sales" or "vendor" mode
 * @returns {Object} - Response for operator and pricing breakdown
 */
export declare const generateRealTimeResponse: ({ transcript, conversationHistory, extractedInfo, leadId, mode, }: {
    transcript: any;
    conversationHistory?: any[];
    extractedInfo?: {};
    leadId?: any;
    mode?: string;
}) => Promise<{
    response: any;
    pricingBreakdown: any;
    nextAction: any;
    confidence: any;
    extractedInfo: {};
}>;
/**
 * Extract learnings from vendor conversation for AI training
 * @param {string} transcript - The vendor conversation transcript
 * @returns {Object} - Extracted learnings
 */
export declare const extractVendorLearnings: (transcript: any) => Promise<{
    effectivePhrases: any;
    negotiationTactics: any;
    pricingStrategies: any;
    objectionHandling: any;
    closingTechniques: any;
    toneNotes: any;
}>;
/**
 * Extract learnings from sales conversation for AI training
 * @param {string} transcript - The sales conversation transcript
 * @returns {Object} - Extracted learnings
 */
export declare const extractSalesLearnings: (transcript: any) => Promise<{
    effectivePhrases: any;
    salesTactics: any;
    objectionHandling: any;
    closingTechniques: any;
    pricingStrategies: any;
    toneNotes: any;
}>;
/**
 * Get vendor learnings context for AI prompt
 * @returns {string} - Formatted learning context for AI prompt
 */
export declare const getVendorLearningsContext: () => Promise<string>;
//# sourceMappingURL=salesAssistService.d.ts.map