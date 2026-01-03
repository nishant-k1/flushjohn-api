/**
 * Automated Blog Generation Service
 * Handles weekly automated blog post generation and publishing
 */
/**
 * Generate a single automated blog post
 * @param {string} contentType - 'construction', 'city', 'problemSolving', or null for default
 * @param {boolean} randomize - Whether to randomize topic selection (for manual generation)
 */
export declare function generateAutomatedBlogPost(contentType?: any, randomize?: boolean): Promise<{
    title: any;
    slug: any;
    content: any;
    excerpt: any;
    author: string;
    tags: any;
    status: string;
    category: any;
    city: any;
    state: any;
    coverImageUnsplash: {
        src: any;
        alt: any;
    };
    publishedAt: Date;
    metaDescription: any;
    metaKeywords: any;
    featured: boolean;
    priority: any;
    views: number;
    likes: number;
    comments: any[];
    automated: boolean;
    automationDate: Date;
    faqSchema: {
        "@context": string;
        "@type": string;
        mainEntity: {
            "@type": string;
            name: any;
            acceptedAnswer: {
                "@type": string;
                text: string;
            };
        }[];
    };
}>;
/**
 * Publish an automated blog post to the database
 */
export declare function publishAutomatedBlogPost(blogData: any): Promise<import("mongoose").Document<unknown, {}, {
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
/**
 * Complete automated blog generation and publishing workflow
 * @param {string} contentType - 'construction', 'city', 'problemSolving', or null for default
 * @param {boolean} randomize - Whether to randomize topic selection (for manual generation)
 */
export declare function runAutomatedBlogGeneration(contentType?: any, randomize?: boolean): Promise<{
    success: boolean;
    blogPost: import("mongoose").Document<unknown, {}, {
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
    };
    duration: number;
    timestamp: Date;
    error?: undefined;
} | {
    success: boolean;
    error: any;
    duration: number;
    timestamp: Date;
    blogPost?: undefined;
}>;
/**
 * Get automation statistics
 */
export declare function getAutomationStats(): Promise<{
    totalAutomatedPosts: any;
    lastAutomatedPost: any;
    currentSeason: string;
    nextTopic: any;
    automationStatus: string;
    error?: undefined;
} | {
    totalAutomatedPosts: number;
    lastAutomatedPost: any;
    currentSeason: string;
    nextTopic: any;
    automationStatus: string;
    error: any;
}>;
//# sourceMappingURL=automatedBlogService.d.ts.map