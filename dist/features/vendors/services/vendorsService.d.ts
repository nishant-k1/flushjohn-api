/**
 * Vendors Service - Business Logic Layer
 */
export declare const generateVendorNumber: () => Promise<any>;
export declare const createVendor: (vendorData: any) => Promise<any>;
export declare const getAllVendors: ({ page, limit, sortBy, sortOrder, search, ...columnFilters }: {
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
export declare const getVendorById: (id: any) => Promise<any>;
export declare const updateVendor: (id: any, updateData: any) => Promise<any>;
export declare const deleteVendor: (id: any) => Promise<{
    _id: any;
}>;
export declare const isValidObjectId: (id: any) => boolean;
//# sourceMappingURL=vendorsService.d.ts.map