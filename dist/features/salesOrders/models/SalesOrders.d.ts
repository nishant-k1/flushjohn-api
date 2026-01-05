import mongoose from "mongoose";
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    products: any[];
    salesOrderNo: number;
    emailStatus: string;
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
    status: "active" | "cancelled";
    paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
    orderTotal: number;
    paidAmount: number;
    balanceDue: number;
    leadNo?: string;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    customerNo?: number;
    quote?: mongoose.Types.ObjectId;
    dueDate?: NativeDate;
    stripeCustomerId?: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    products: any[];
    salesOrderNo: number;
    emailStatus: string;
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
    status: "active" | "cancelled";
    paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
    orderTotal: number;
    paidAmount: number;
    balanceDue: number;
    leadNo?: string;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    customerNo?: number;
    quote?: mongoose.Types.ObjectId;
    dueDate?: NativeDate;
    stripeCustomerId?: string;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    products: any[];
    salesOrderNo: number;
    emailStatus: string;
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
    status: "active" | "cancelled";
    paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
    orderTotal: number;
    paidAmount: number;
    balanceDue: number;
    leadNo?: string;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    customerNo?: number;
    quote?: mongoose.Types.ObjectId;
    dueDate?: NativeDate;
    stripeCustomerId?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    products: any[];
    salesOrderNo: number;
    emailStatus: string;
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
    status: "active" | "cancelled";
    paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
    orderTotal: number;
    paidAmount: number;
    balanceDue: number;
    leadNo?: string;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    customerNo?: number;
    quote?: mongoose.Types.ObjectId;
    dueDate?: NativeDate;
    stripeCustomerId?: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    products: any[];
    salesOrderNo: number;
    emailStatus: string;
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
    status: "active" | "cancelled";
    paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
    orderTotal: number;
    paidAmount: number;
    balanceDue: number;
    leadNo?: string;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    customerNo?: number;
    quote?: mongoose.Types.ObjectId;
    dueDate?: NativeDate;
    stripeCustomerId?: string;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    products: any[];
    salesOrderNo: number;
    emailStatus: string;
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
    status: "active" | "cancelled";
    paymentStatus: "Unpaid" | "Partially Paid" | "Paid" | "Refunded";
    orderTotal: number;
    paidAmount: number;
    balanceDue: number;
    leadNo?: string;
    customer?: mongoose.Types.ObjectId;
    contactPersonName?: string;
    contactPersonPhone?: string;
    deliveryDate?: string;
    pickupDate?: string;
    instructions?: string;
    note?: string;
    lead?: mongoose.Types.ObjectId;
    customerNo?: number;
    quote?: mongoose.Types.ObjectId;
    dueDate?: NativeDate;
    stripeCustomerId?: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=SalesOrders.d.ts.map