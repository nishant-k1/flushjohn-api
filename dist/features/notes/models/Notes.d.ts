import mongoose from "mongoose";
declare const Notes: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: mongoose.Types.ObjectId;
    content: string;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: mongoose.Types.ObjectId;
    content: string;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: mongoose.Types.ObjectId;
    content: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: mongoose.Types.ObjectId;
    content: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: mongoose.Types.ObjectId;
    content: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: mongoose.Types.ObjectId;
    content: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default Notes;
//# sourceMappingURL=Notes.d.ts.map