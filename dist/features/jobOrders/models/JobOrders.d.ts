import mongoose from "mongoose";
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    products: any[];
    emailStatus: string;
    vendorAcceptanceStatus: "Pending" | "Accepted" | "Denied";
    vendorHistory: any[];
    billingCycles: mongoose.Types.DocumentArray<{
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }> & {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }>;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    jobOrderNo?: number;
    salesOrder?: mongoose.Types.ObjectId;
    vendor?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
    };
    salesOrderNo?: number;
    customerNo?: number;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    products: any[];
    emailStatus: string;
    vendorAcceptanceStatus: "Pending" | "Accepted" | "Denied";
    vendorHistory: any[];
    billingCycles: mongoose.Types.DocumentArray<{
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }> & {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }>;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    jobOrderNo?: number;
    salesOrder?: mongoose.Types.ObjectId;
    vendor?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
    };
    salesOrderNo?: number;
    customerNo?: number;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    products: any[];
    emailStatus: string;
    vendorAcceptanceStatus: "Pending" | "Accepted" | "Denied";
    vendorHistory: any[];
    billingCycles: mongoose.Types.DocumentArray<{
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }> & {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }>;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    jobOrderNo?: number;
    salesOrder?: mongoose.Types.ObjectId;
    vendor?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
    };
    salesOrderNo?: number;
    customerNo?: number;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    products: any[];
    emailStatus: string;
    vendorAcceptanceStatus: "Pending" | "Accepted" | "Denied";
    vendorHistory: any[];
    billingCycles: mongoose.Types.DocumentArray<{
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }> & {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }>;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    jobOrderNo?: number;
    salesOrder?: mongoose.Types.ObjectId;
    vendor?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
    };
    salesOrderNo?: number;
    customerNo?: number;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    products: any[];
    emailStatus: string;
    vendorAcceptanceStatus: "Pending" | "Accepted" | "Denied";
    vendorHistory: any[];
    billingCycles: mongoose.Types.DocumentArray<{
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }> & {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }>;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    jobOrderNo?: number;
    salesOrder?: mongoose.Types.ObjectId;
    vendor?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
    };
    salesOrderNo?: number;
    customerNo?: number;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    products: any[];
    emailStatus: string;
    vendorAcceptanceStatus: "Pending" | "Accepted" | "Denied";
    vendorHistory: any[];
    billingCycles: mongoose.Types.DocumentArray<{
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }> & {
        units: mongoose.Types.DocumentArray<{
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }> & {
            rate: number;
            quantity: number;
            productId: string;
            productName: string;
            unitId: string;
            status: "active" | "returned" | "extended";
            returnedQuantity: number;
            returnedOn?: NativeDate;
        }>;
        isExtended: boolean;
        cycleStartDate?: string;
        cycleEndDate?: string;
        nextBillingCycleDate?: string;
        nextBillingCycleEndDate?: string;
        extendedOn?: NativeDate;
    }>;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    jobOrderNo?: number;
    salesOrder?: mongoose.Types.ObjectId;
    vendor?: {
        _id?: mongoose.Types.ObjectId;
        name?: string;
    };
    salesOrderNo?: number;
    customerNo?: number;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=JobOrders.d.ts.map