export declare const generateQuoteNumber: () => Promise<any>;
export declare const createQuote: (quoteData: any) => Promise<any>;
export declare const getAllQuotes: ({ page, limit, sortBy, sortOrder, search, ...columnFilters }: {
    [x: string]: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
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
export declare const getQuoteById: (id: any) => Promise<any>;
export declare const updateQuote: (id: any, updateData: any) => Promise<any>;
export declare const deleteQuote: (id: any) => Promise<{
    _id: any;
}>;
export declare const isValidObjectId: (id: any) => boolean;
//# sourceMappingURL=quotesService.d.ts.map