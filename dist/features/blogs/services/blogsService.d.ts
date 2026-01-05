export declare const generateBlogNumber: () => Promise<number>;
export declare const createBlogWithRetry: (blogData: any, maxRetries?: number) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const generateSlug: (title: any) => any;
export declare const generateUniqueSlug: (title: any) => Promise<any>;
export declare const getBlogBySlug: (slug: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const createBlog: (blogData: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const getAllBlogs: ({ page, limit, sortBy, sortOrder, slug, search, status, ...columnFilters }: {
    [x: string]: any;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    slug?: any;
    search?: string;
    status?: any;
}) => Promise<{
    data: (import("mongoose").FlattenMaps<{
        createdAt: NativeDate;
        updatedAt: NativeDate;
        wordCount: number;
        status: "draft" | "published" | "archived";
        blogNo: number;
        title: string;
        slug: string;
        content: string;
        author: string;
        tags: string[];
        category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
        metaKeywords: string[];
        readingTime: number;
        featured: boolean;
        views: number;
        likes: number;
        comments: import("mongoose").Types.DocumentArray<{
            createdAt: NativeDate;
            user: string;
            content: string;
            isApproved: boolean;
        }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
            createdAt: NativeDate;
            user: string;
            content: string;
            isApproved: boolean;
        }> & {
            createdAt: NativeDate;
            user: string;
            content: string;
            isApproved: boolean;
        }>;
        automated: boolean;
        priority: "high" | "medium" | "low";
        city?: string;
        state?: string;
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
        faqSchema?: any;
        automationDate?: NativeDate;
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}>;
export declare const getBlogById: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const updateBlog: (id: any, updateData: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const deleteBlog: (id: any) => Promise<{
    _id: any;
}>;
export declare const regenerateExcerpt: (id: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    wordCount: number;
    status: "draft" | "published" | "archived";
    blogNo: number;
    title: string;
    slug: string;
    content: string;
    author: string;
    tags: string[];
    category: "construction" | "general" | "porta-potty-rental" | "events" | "tips" | "news";
    metaKeywords: string[];
    readingTime: number;
    featured: boolean;
    views: number;
    likes: number;
    comments: import("mongoose").Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }> & {
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }>;
    automated: boolean;
    priority: "high" | "medium" | "low";
    city?: string;
    state?: string;
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
    faqSchema?: any;
    automationDate?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const isValidObjectId: (id: any) => boolean;
//# sourceMappingURL=blogsService.d.ts.map