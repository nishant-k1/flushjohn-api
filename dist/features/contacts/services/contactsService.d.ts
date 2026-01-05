/**
 * Contacts Service - Business Logic Layer
 *
 * This layer contains all business logic for Contacts.
 * It orchestrates repositories and handles business rules.
 */
/**
 * Create a new contact
 */
export declare const createContact: (contactData: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Get all contacts with filters and pagination
 */
export declare const getAllContacts: ({ page, limit, sortBy, sortOrder, status, search, ...columnFilters }: {
    [x: string]: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    status: any;
    search: any;
}) => Promise<{
    data: (import("mongoose").FlattenMaps<{
        message: string;
        createdAt: NativeDate;
        email: string;
        phone: string;
        status: "New" | "Read" | "Replied" | "Archived";
        firstName: string;
        lastName: string;
        readAt?: NativeDate;
        repliedAt?: NativeDate;
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[];
    pagination: {
        currentPage: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}>;
/**
 * Get a contact by ID
 */
export declare const getContactById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Update a contact by ID
 */
export declare const updateContact: (id: any, updateData: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
}, {}, import("mongoose").DefaultSchemaOptions> & {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
/**
 * Delete a contact by ID
 */
export declare const deleteContact: (id: any) => Promise<{
    message: string;
}>;
/**
 * Validate pagination parameters
 */
export declare const validatePaginationParams: (page: any, limit: any) => any[];
/**
 * Check if string is a valid MongoDB ObjectId
 */
export declare const isValidObjectId: (id: any) => boolean;
//# sourceMappingURL=contactsService.d.ts.map