import mongoose from "mongoose";
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    country: string;
    representatives: mongoose.Types.DocumentArray<{
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }> & {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }>;
    products: any[];
    name?: string;
    city?: string;
    state?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    zip?: string;
    note?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    country: string;
    representatives: mongoose.Types.DocumentArray<{
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }> & {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }>;
    products: any[];
    name?: string;
    city?: string;
    state?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    zip?: string;
    note?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    country: string;
    representatives: mongoose.Types.DocumentArray<{
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }> & {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }>;
    products: any[];
    name?: string;
    city?: string;
    state?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    zip?: string;
    note?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    country: string;
    representatives: mongoose.Types.DocumentArray<{
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }> & {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }>;
    products: any[];
    name?: string;
    city?: string;
    state?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    zip?: string;
    note?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    country: string;
    representatives: mongoose.Types.DocumentArray<{
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }> & {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }>;
    products: any[];
    name?: string;
    city?: string;
    state?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    zip?: string;
    note?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    country: string;
    representatives: mongoose.Types.DocumentArray<{
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }> & {
        name: string;
        isActive: boolean;
        email?: string;
        phone?: string;
    }>;
    products: any[];
    name?: string;
    city?: string;
    state?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    zip?: string;
    note?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=Vendors.d.ts.map