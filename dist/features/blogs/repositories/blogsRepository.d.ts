/**
 * Blogs Repository - Database Access Layer
 */
export declare const create: (blogData: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const findAll: ({ query, sort, skip, limit }: {
    query?: {};
    sort?: {};
    skip?: number;
    limit?: number;
}) => Promise<(import("mongoose").FlattenMaps<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
})[]>;
export declare const count: (query?: {}) => Promise<number>;
export declare const findById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const findOne: (query: any, projection?: any, options?: {}) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const updateById: (id: any, updateData: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const deleteById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    status: "draft" | "published" | "archived";
    category: "general" | "porta-potty-rental" | "construction" | "events" | "tips" | "news";
    metaKeywords: string[];
    wordCount: number;
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    excerpt?: string;
    coverImageS3?: {
        alt: string;
        src?: string;
    };
    coverImageUnsplash?: {
        alt: string;
        src?: string;
    };
    publishedAt?: NativeDate;
    metaDescription?: string;
    city?: string;
    state?: string;
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const exists: (id: any) => Promise<{
    _id: import("bson").ObjectId;
}>;
//# sourceMappingURL=blogsRepository.d.ts.map