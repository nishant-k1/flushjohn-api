/**
 * Vendor Pricing History Repository - Database Access Layer
 */
export declare const create: (pricingData: any) => Promise<any>;
export declare const findById: (id: any) => Promise<any>;
export declare const findRecentPricing: ({ zipCode, city, state, eventType, quantity, limit, }: {
    zipCode: any;
    city: any;
    state: any;
    eventType: any;
    quantity: any;
    limit?: number;
}) => Promise<any>;
export declare const findByVendorId: (vendorId: any, limit?: number) => Promise<any>;
export declare const calculateAveragePricing: ({ zipCode, city, state, eventType, quantity, }: {
    zipCode: any;
    city: any;
    state: any;
    eventType: any;
    quantity: any;
}) => Promise<{
    averagePricePerUnit: number;
    averageTotalPrice: number;
    sampleSize: any;
    pricingHistory: any;
}>;
export declare const update: (id: any, updateData: any) => Promise<any>;
export declare const deleteById: (id: any) => Promise<any>;
//# sourceMappingURL=vendorPricingRepository.d.ts.map