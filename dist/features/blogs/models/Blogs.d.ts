import mongoose from "mongoose";
declare const _default: mongoose.Model<{
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps, {}, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
    toJSON: {
        virtuals: true;
    };
    toObject: {
        virtuals: true;
    };
}>> & mongoose.FlatRecord<{
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        content: string;
        user: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=Blogs.d.ts.map