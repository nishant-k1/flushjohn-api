import mongoose from "mongoose";
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    products: any[];
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
    name?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
    note?: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    products: any[];
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
    name?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
    note?: string;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    products: any[];
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
    name?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
    note?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    products: any[];
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
    name?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
    note?: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    products: any[];
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
    name?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
    note?: string;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    products: any[];
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
    name?: string;
    cName?: string;
    email?: string;
    phone?: string;
    fax?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    vendorNo?: number;
    serviceCities?: string;
    serviceStates?: string;
    serviceZipCodes?: string;
    note?: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=Vendors.d.ts.map