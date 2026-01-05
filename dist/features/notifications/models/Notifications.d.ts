import mongoose from "mongoose";
declare const Notification: mongoose.Model<{
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: mongoose.Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: mongoose.Types.ObjectId;
    readAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: mongoose.Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: mongoose.Types.ObjectId;
    readAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: mongoose.Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: mongoose.Types.ObjectId;
    readAt?: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: mongoose.Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: mongoose.Types.ObjectId;
    readAt?: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: mongoose.Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: mongoose.Types.ObjectId;
    readAt?: NativeDate;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    message: string;
    type: "new_lead" | "order_created" | "quote_created" | "job_order_created";
    read: boolean;
    userId: mongoose.Types.ObjectId;
    title: string;
    metadata: any;
    leadId?: mongoose.Types.ObjectId;
    readAt?: NativeDate;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default Notification;
//# sourceMappingURL=Notifications.d.ts.map