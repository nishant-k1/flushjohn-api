export declare const getUserNotifications: (userId: any, options?: {}) => Promise<(import("mongoose").FlattenMaps<{
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
export declare const getUnreadCount: (userId: any) => Promise<number>;
export declare const createNotification: (notificationData: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const createOrUpdateNotification: (userId: any, leadId: any, data: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const markNotificationAsRead: (notificationId: any, userId: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const markAllNotificationsAsRead: (userId: any) => Promise<import("mongoose").UpdateWriteOpResult>;
export declare const deleteNotification: (notificationId: any, userId: any) => Promise<import("mongoose").Document<unknown, {}, {
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
export declare const deleteNotificationsByLeadId: (leadId: any) => Promise<import("mongodb").DeleteResult>;
export declare const deleteAllNotifications: (userId: any) => Promise<import("mongodb").DeleteResult>;
//# sourceMappingURL=notificationsService.d.ts.map