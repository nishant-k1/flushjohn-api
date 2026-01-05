export declare const findByUserId: (userId: any, options?: {}) => Promise<(import("mongoose").FlattenMaps<{
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
})[]>;
export declare const findUnreadCount: (userId: any) => Promise<number>;
export declare const findById: (notificationId: any) => Promise<import("mongoose").FlattenMaps<{
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const findByUserIdAndLeadId: (userId: any, leadId: any) => Promise<import("mongoose").FlattenMaps<{
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
    createdAt: NativeDate;
    updatedAt: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const create: (data: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const createOrUpdate: (userId: any, leadId: any, data: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const markAsRead: (notificationId: any, userId: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const markAllAsRead: (userId: any) => Promise<import("mongoose").UpdateWriteOpResult>;
export declare const deleteById: (notificationId: any, userId: any) => Promise<import("mongoose").Document<unknown, {}, {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: import("mongoose").Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: import("mongoose").Types.ObjectId;
    readAt?: NativeDate;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const deleteByLeadId: (leadId: any) => Promise<import("mongodb").DeleteResult>;
export declare const deleteAll: (userId: any) => Promise<import("mongodb").DeleteResult>;
export declare const deleteOldNotifications: (daysOld?: number) => Promise<import("mongodb").DeleteResult>;
//# sourceMappingURL=notificationsRepository.d.ts.map