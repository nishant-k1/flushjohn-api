export declare const generateJobOrderNumber: () => Promise<any>;
export declare const createJobOrder: (jobOrderData: any) => Promise<any>;
export declare const getAllJobOrders: ({ page, limit, sortBy, sortOrder, search, startDate, endDate, ...columnFilters }: {
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
        currentPage: any;
        totalPages: number;
        totalItems: any;
        itemsPerPage: any;
        hasNextPage: boolean;
        hasPrevPage: boolean;
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
export declare const getJobOrderById: (id: any) => Promise<any>;
export declare const updateJobOrder: (id: any, updateData: any) => Promise<any>;
export declare const deleteJobOrder: (id: any) => Promise<{
    _id: any;
}>;
export declare const createOrLinkCustomerFromJobOrder: (jobOrder: any) => Promise<any>;
export declare const isValidObjectId: (id: any) => boolean;
//# sourceMappingURL=jobOrdersService.d.ts.map