export declare const generateSalesOrderNumber: () => Promise<any>;
export declare const createSalesOrder: (salesOrderData: any) => Promise<any>;
export declare const getAllSalesOrders: ({ page, limit, sortBy, sortOrder, search, startDate, endDate, ...columnFilters }: {
    [x: string]: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    startDate?: any;
    endDate?: any;
}) => Promise<{
    data: any[];
    pagination: {
        page: any;
        limit: any;
        totalItems: any;
        totalPages: number;
    };
} | {
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
export declare const getSalesOrderById: (id: any) => Promise<any>;
export declare const updateSalesOrder: (id: any, updateData: any) => Promise<any>;
export declare const cancelSalesOrder: (id: any) => Promise<any>;
export declare const deleteSalesOrder: (id: any) => Promise<{
    _id: any;
}>;
export declare const isValidObjectId: (id: any) => boolean;
export declare const linkSalesOrderToCustomer: (salesOrder: any, leadId?: any) => Promise<any>;
export declare const createOrLinkCustomerFromSalesOrder: (salesOrder: any) => Promise<any>;
//# sourceMappingURL=salesOrdersService.d.ts.map