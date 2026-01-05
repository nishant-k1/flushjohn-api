import mongoose from "mongoose";
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    transcript: string;
    outcome: "pending" | "converted" | "lost" | "callback" | "no_sale";
    conversionSuccess: boolean;
    customerObjections: string[];
    successfulResponses: string[];
    effectiveTactics: string[];
    processed: boolean;
    lead?: mongoose.Types.ObjectId;
    extractedInfo?: {
        dates?: {
            delivery?: string;
            pickup?: string;
        };
        eventType?: string;
        quantity?: number;
        intent?: string;
        summary?: string;
        location?: {
            city?: string;
            state?: string;
            zipCode?: string;
            address?: string;
        };
    };
    quotedPrice?: number;
    pricingBreakdown?: {
        delivery?: number;
        fuelSurcharge?: number;
        subtotal?: number;
        taxRate?: number;
        taxAmount?: number;
        margin?: number;
        grandTotal?: number;
        units?: {
            quantity?: number;
            pricePerUnit?: number;
            total?: number;
        };
    };
    salesOrderId?: mongoose.Types.ObjectId;
    jobOrderId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    avgConfidence?: "high" | "medium" | "low";
    operatorFeedback?: string;
    aiHelpful?: boolean;
    extractedLearnings?: {
        effectivePhrases: string[];
        salesTactics: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    transcript: string;
    outcome: "pending" | "converted" | "lost" | "callback" | "no_sale";
    conversionSuccess: boolean;
    customerObjections: string[];
    successfulResponses: string[];
    effectiveTactics: string[];
    processed: boolean;
    lead?: mongoose.Types.ObjectId;
    extractedInfo?: {
        dates?: {
            delivery?: string;
            pickup?: string;
        };
        eventType?: string;
        quantity?: number;
        intent?: string;
        summary?: string;
        location?: {
            city?: string;
            state?: string;
            zipCode?: string;
            address?: string;
        };
    };
    quotedPrice?: number;
    pricingBreakdown?: {
        delivery?: number;
        fuelSurcharge?: number;
        subtotal?: number;
        taxRate?: number;
        taxAmount?: number;
        margin?: number;
        grandTotal?: number;
        units?: {
            quantity?: number;
            pricePerUnit?: number;
            total?: number;
        };
    };
    salesOrderId?: mongoose.Types.ObjectId;
    jobOrderId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    avgConfidence?: "high" | "medium" | "low";
    operatorFeedback?: string;
    aiHelpful?: boolean;
    extractedLearnings?: {
        effectivePhrases: string[];
        salesTactics: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    transcript: string;
    outcome: "pending" | "converted" | "lost" | "callback" | "no_sale";
    conversionSuccess: boolean;
    customerObjections: string[];
    successfulResponses: string[];
    effectiveTactics: string[];
    processed: boolean;
    lead?: mongoose.Types.ObjectId;
    extractedInfo?: {
        dates?: {
            delivery?: string;
            pickup?: string;
        };
        eventType?: string;
        quantity?: number;
        intent?: string;
        summary?: string;
        location?: {
            city?: string;
            state?: string;
            zipCode?: string;
            address?: string;
        };
    };
    quotedPrice?: number;
    pricingBreakdown?: {
        delivery?: number;
        fuelSurcharge?: number;
        subtotal?: number;
        taxRate?: number;
        taxAmount?: number;
        margin?: number;
        grandTotal?: number;
        units?: {
            quantity?: number;
            pricePerUnit?: number;
            total?: number;
        };
    };
    salesOrderId?: mongoose.Types.ObjectId;
    jobOrderId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    avgConfidence?: "high" | "medium" | "low";
    operatorFeedback?: string;
    aiHelpful?: boolean;
    extractedLearnings?: {
        effectivePhrases: string[];
        salesTactics: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    transcript: string;
    outcome: "pending" | "converted" | "lost" | "callback" | "no_sale";
    conversionSuccess: boolean;
    customerObjections: string[];
    successfulResponses: string[];
    effectiveTactics: string[];
    processed: boolean;
    lead?: mongoose.Types.ObjectId;
    extractedInfo?: {
        dates?: {
            delivery?: string;
            pickup?: string;
        };
        eventType?: string;
        quantity?: number;
        intent?: string;
        summary?: string;
        location?: {
            city?: string;
            state?: string;
            zipCode?: string;
            address?: string;
        };
    };
    quotedPrice?: number;
    pricingBreakdown?: {
        delivery?: number;
        fuelSurcharge?: number;
        subtotal?: number;
        taxRate?: number;
        taxAmount?: number;
        margin?: number;
        grandTotal?: number;
        units?: {
            quantity?: number;
            pricePerUnit?: number;
            total?: number;
        };
    };
    salesOrderId?: mongoose.Types.ObjectId;
    jobOrderId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    avgConfidence?: "high" | "medium" | "low";
    operatorFeedback?: string;
    aiHelpful?: boolean;
    extractedLearnings?: {
        effectivePhrases: string[];
        salesTactics: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    transcript: string;
    outcome: "pending" | "converted" | "lost" | "callback" | "no_sale";
    conversionSuccess: boolean;
    customerObjections: string[];
    successfulResponses: string[];
    effectiveTactics: string[];
    processed: boolean;
    lead?: mongoose.Types.ObjectId;
    extractedInfo?: {
        dates?: {
            delivery?: string;
            pickup?: string;
        };
        eventType?: string;
        quantity?: number;
        intent?: string;
        summary?: string;
        location?: {
            city?: string;
            state?: string;
            zipCode?: string;
            address?: string;
        };
    };
    quotedPrice?: number;
    pricingBreakdown?: {
        delivery?: number;
        fuelSurcharge?: number;
        subtotal?: number;
        taxRate?: number;
        taxAmount?: number;
        margin?: number;
        grandTotal?: number;
        units?: {
            quantity?: number;
            pricePerUnit?: number;
            total?: number;
        };
    };
    salesOrderId?: mongoose.Types.ObjectId;
    jobOrderId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    avgConfidence?: "high" | "medium" | "low";
    operatorFeedback?: string;
    aiHelpful?: boolean;
    extractedLearnings?: {
        effectivePhrases: string[];
        salesTactics: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    transcript: string;
    outcome: "pending" | "converted" | "lost" | "callback" | "no_sale";
    conversionSuccess: boolean;
    customerObjections: string[];
    successfulResponses: string[];
    effectiveTactics: string[];
    processed: boolean;
    lead?: mongoose.Types.ObjectId;
    extractedInfo?: {
        dates?: {
            delivery?: string;
            pickup?: string;
        };
        eventType?: string;
        quantity?: number;
        intent?: string;
        summary?: string;
        location?: {
            city?: string;
            state?: string;
            zipCode?: string;
            address?: string;
        };
    };
    quotedPrice?: number;
    pricingBreakdown?: {
        delivery?: number;
        fuelSurcharge?: number;
        subtotal?: number;
        taxRate?: number;
        taxAmount?: number;
        margin?: number;
        grandTotal?: number;
        units?: {
            quantity?: number;
            pricePerUnit?: number;
            total?: number;
        };
    };
    salesOrderId?: mongoose.Types.ObjectId;
    jobOrderId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    avgConfidence?: "high" | "medium" | "low";
    operatorFeedback?: string;
    aiHelpful?: boolean;
    extractedLearnings?: {
        effectivePhrases: string[];
        salesTactics: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=ConversationLog.d.ts.map