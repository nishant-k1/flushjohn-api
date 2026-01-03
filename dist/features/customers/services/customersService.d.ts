/**
 * Customers Service - Business Logic Layer
 */
export declare const generateCustomerNumber: () => Promise<any>;
export declare const createCustomer: (customerData: any) => Promise<any>;
export declare const getAllCustomers: ({ page, limit, sortBy, sortOrder, search, ...columnFilters }: {
    [x: string]: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
}) => Promise<{
    data: any;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: any;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}>;
export declare const getCustomerById: (id: any) => Promise<any>;
export declare const updateCustomer: (id: any, updateData: any) => Promise<any>;
export declare const deleteCustomer: (id: any) => Promise<{
    _id: any;
}>;
export declare const isValidObjectId: (id: any) => boolean;
//# sourceMappingURL=customersService.d.ts.map