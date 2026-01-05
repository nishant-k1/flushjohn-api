export declare const queueImageCleanup: (imageUrl: any, delay?: number) => Promise<void>;
export declare const queueMultipleImageCleanup: (imageUrls: any, delay?: number) => Promise<void>;
export declare const getQueueStatus: () => {
    pending: number;
    processing: number;
    queue: {
        imageUrl: any;
        attempts: any;
        age: number;
    }[];
};
//# sourceMappingURL=imageCleanupQueue.d.ts.map