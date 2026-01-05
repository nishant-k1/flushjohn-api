import { Schema } from "mongoose";
declare const Contacts: import("mongoose").Model<{
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
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
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    message: string;
    createdAt: NativeDate;
    email: string;
    phone: string;
    status: "New" | "Read" | "Replied" | "Archived";
    firstName: string;
    lastName: string;
    readAt?: NativeDate;
    repliedAt?: NativeDate;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
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
}>>;
export default Contacts;
//# sourceMappingURL=Contacts.d.ts.map