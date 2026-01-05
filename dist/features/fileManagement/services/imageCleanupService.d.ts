export declare const deleteImageFromS3: (imageUrl: any) => Promise<boolean>;
export declare const cleanupMultipleImages: (imageUrls: any) => Promise<{
    successful: any[];
    failed: any[];
    total: any;
}>;
export declare const cleanupOrphanedImages: (allImageUrls: any) => Promise<{
    successful: any[];
    failed: any[];
    total: number;
}>;
//# sourceMappingURL=imageCleanupService.d.ts.map