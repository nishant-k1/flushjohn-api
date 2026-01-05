export declare const findByUserId: (userId: any) => Promise<import("mongoose").FlattenMaps<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: import("mongoose").Types.ObjectId;
    content: string;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const create: (data: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: import("mongoose").Types.ObjectId;
    content: string;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: import("mongoose").Types.ObjectId;
    content: string;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const updateByUserId: (userId: any, content: any) => Promise<import("mongoose").Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: import("mongoose").Types.ObjectId;
    content: string;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    userId: import("mongoose").Types.ObjectId;
    content: string;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare const deleteByUserId: (userId: any) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=notesRepository.d.ts.map