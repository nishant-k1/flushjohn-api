import mongoose from "mongoose";
declare const _default: mongoose.Model<{
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
    comments: mongoose.Types.DocumentArray<{
        createdAt: NativeDate;
        user: string;
        content: string;
        isApproved: boolean;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
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
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=Blogs.d.ts.map