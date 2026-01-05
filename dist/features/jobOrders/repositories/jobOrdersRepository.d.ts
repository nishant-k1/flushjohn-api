/**
 * Job Orders Repository - Database Access Layer
 */
export declare const create: (jobOrderData: any) => Promise<any>;
export declare const findAll: ({ query, sort, skip, limit, }: {
    query?: {};
    sort?: {};
    skip?: number;
    limit?: number;
}) => Promise<any>;
export declare const count: (query?: {}) => Promise<number>;
export declare const findById: (id: any) => Promise<any>;
export declare const findOne: (query: any, projection?: any) => Promise<any>;
export declare const updateById: (id: any, updateData: any) => Promise<any>;
export declare const deleteById: (id: any) => Promise<any>;
export declare const exists: (id: any) => Promise<{
    _id: import("bson").ObjectId;
}>;
//# sourceMappingURL=jobOrdersRepository.d.ts.map