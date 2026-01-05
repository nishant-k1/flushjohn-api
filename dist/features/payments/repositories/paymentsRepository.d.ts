/**
 * Payments Repository
 * Database operations for Payments
 */
export declare const findAll: ({ query, sort, skip, limit, }: {
    query?: {};
    sort?: {};
    skip?: number;
    limit?: number;
}) => Promise<any>;
export declare const findById: (id: any) => Promise<any>;
export declare const findOne: (query: any, select?: any) => Promise<any>;
export declare const create: (data: any) => Promise<any>;
export declare const updateById: (id: any, updateData: any) => Promise<any>;
export declare const findOneAndUpdate: (query: any, updateData: any) => Promise<any>;
export declare const deleteById: (id: any) => Promise<any>;
export declare const count: (query?: {}) => Promise<number>;
export declare const findBySalesOrder: (salesOrderId: any) => Promise<any>;
export declare const findByStripePaymentIntentId: (paymentIntentId: any) => Promise<any>;
export declare const findByStripePaymentLinkId: (paymentLinkId: any) => Promise<any>;
export declare const findByStripeChargeId: (chargeId: any) => Promise<any>;
//# sourceMappingURL=paymentsRepository.d.ts.map