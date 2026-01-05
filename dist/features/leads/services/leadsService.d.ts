/**
 * Leads Service - Business Logic Layer
 *
 * This layer contains all business logic for Leads.
 * It orchestrates repositories and handles business rules.
 */
/**
 * Transform products based on lead source
 */
export declare const transformProductsData: (leadSource: any, products: any) => {
    id: any;
    item: string;
    desc: string;
    qty: number;
    rate: number;
    amount: number;
}[];
/**
 * Prepare lead data for creation
 */
export declare const prepareLeadData: (leadData: any) => any;
/**
 * Generate next lead number
 */
export declare const generateLeadNumber: () => Promise<number>;
/**
 * Send lead alerts (non-blocking)
 */
export declare const sendLeadAlerts: (lead: any, leadNo: any) => Promise<void>;
/**
 * Create a new lead
 */
export declare const createLead: (leadData: any) => Promise<import("mongoose").Document<unknown, {}, {
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
 * Get all leads with filters and pagination
 */
export declare const getAllLeads: ({ page, limit, sortBy, sortOrder, status, assignedTo, leadSource, search, hasCustomerNo, ...columnFilters }: {
    [x: string]: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    status: any;
    assignedTo: any;
    leadSource: any;
    search: any;
    hasCustomerNo: any;
}) => Promise<{
    data: (import("mongoose").FlattenMaps<{
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
    })[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        nextPage: number;
        prevPage: number;
    };
    filters: {
        sortBy: string;
        sortOrder: string;
        status: any;
        assignedTo: any;
        leadSource: any;
        search: any;
    };
}>;
/**
 * Get a single lead by ID
 */
export declare const getLeadById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const updateLead: (id: any, updateData: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const deleteLead: (id: any) => Promise<{
    _id: any;
}>;
/**
 * Validate MongoDB ObjectId format
 */
export declare const isValidObjectId: (id: any) => boolean;
/**
 * Validate pagination parameters
 */
export declare const validatePaginationParams: (page: any, limit: any) => any[];
//# sourceMappingURL=leadsService.d.ts.map