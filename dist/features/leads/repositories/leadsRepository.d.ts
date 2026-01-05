/**
 * Leads Repository - Database Access Layer
 *
 * This layer handles all direct database operations for Leads.
 * No business logic should be here - just pure database queries.
 */
/**
 * Create a new lead
 */
export declare const create: (leadData: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Find all leads with filters, sorting, and pagination
 */
export declare const findAll: ({ query, sort, skip, limit }: {
    query?: {};
    sort?: {};
    skip?: number;
    limit?: number;
}) => Promise<(import("mongoose").FlattenMaps<{
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
})[]>;
/**
 * Count leads matching query
 */
export declare const count: (query?: {}) => Promise<number>;
/**
 * Find a lead by ID
 */
export declare const findById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Find one lead matching query
 */
export declare const findOne: (query: any, projection?: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Update a lead by ID
 */
export declare const updateById: (id: any, updateData: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Delete a lead by ID
 */
export declare const deleteById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    createdAt: NativeDate;
    leadStatus: string;
    quotes: import("mongoose").Types.ObjectId[];
    salesOrders: import("mongoose").Types.ObjectId[];
    jobOrders: import("mongoose").Types.ObjectId[];
    products: any[];
    country: string;
    leadNo?: number;
    leadSource?: string;
    assignedTo?: string;
    customer?: import("mongoose").Types.ObjectId;
    usageType?: string;
    fName?: string;
    lName?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    instructions?: string;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Check if a lead exists by ID
 */
export declare const exists: (id: any) => Promise<{
    _id: import("bson").ObjectId;
}>;
//# sourceMappingURL=leadsRepository.d.ts.map