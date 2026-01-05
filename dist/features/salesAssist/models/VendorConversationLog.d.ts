import mongoose from "mongoose";
declare const _default: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<{
    createdAt: NativeDate;
    transcript: string;
    processed: boolean;
    speakerCount: number;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    extractedLearnings?: {
        effectivePhrases: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        negotiationTactics: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
    wordCount?: number;
    lineCount?: number;
    qualityRating?: number;
    operatorNotes?: string;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    transcript: string;
    processed: boolean;
    speakerCount: number;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    extractedLearnings?: {
        effectivePhrases: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        negotiationTactics: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
    wordCount?: number;
    lineCount?: number;
    qualityRating?: number;
    operatorNotes?: string;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    transcript: string;
    processed: boolean;
    speakerCount: number;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    extractedLearnings?: {
        effectivePhrases: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        negotiationTactics: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
    wordCount?: number;
    lineCount?: number;
    qualityRating?: number;
    operatorNotes?: string;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    transcript: string;
    processed: boolean;
    speakerCount: number;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    extractedLearnings?: {
        effectivePhrases: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        negotiationTactics: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
    wordCount?: number;
    lineCount?: number;
    qualityRating?: number;
    operatorNotes?: string;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    transcript: string;
    processed: boolean;
    speakerCount: number;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    extractedLearnings?: {
        effectivePhrases: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        negotiationTactics: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
    wordCount?: number;
    lineCount?: number;
    qualityRating?: number;
    operatorNotes?: string;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    transcript: string;
    processed: boolean;
    speakerCount: number;
    operatorId?: mongoose.Types.ObjectId;
    duration?: number;
    extractedLearnings?: {
        effectivePhrases: string[];
        objectionHandling: string[];
        closingTechniques: string[];
        pricingStrategies: string[];
        negotiationTactics: string[];
        toneNotes?: string;
    };
    processedAt?: NativeDate;
    wordCount?: number;
    lineCount?: number;
    qualityRating?: number;
    operatorNotes?: string;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=VendorConversationLog.d.ts.map