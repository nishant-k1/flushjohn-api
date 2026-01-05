/**
 * Contacts Repository - Database Access Layer
 *
 * This layer handles all direct database operations for Contacts.
 * No business logic should be here - just pure database queries.
 */
/**
 * Create a new contact
 */
export declare const create: (contactData: any) => Promise<import("mongoose").Document<unknown, {}, {
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
 * Find all contacts with filters, sorting, and pagination
 */
export declare const findAll: ({ query, sort, skip, limit }: {
    query?: {};
    sort?: {};
    skip?: number;
    limit?: number;
}) => Promise<(import("mongoose").FlattenMaps<{
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
})[]>;
/**
 * Count contacts matching query
 */
export declare const count: (query?: {}) => Promise<number>;
/**
 * Find a contact by ID
 */
export declare const findById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
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
 * Find one contact matching query
 */
export declare const findOne: (query: any, projection?: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const updateById: (id: any, updateData: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const deleteById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
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
 * Check if a contact exists by ID
 */
export declare const exists: (id: any) => Promise<{
    _id: import("bson").ObjectId;
}>;
//# sourceMappingURL=contactsRepository.d.ts.map