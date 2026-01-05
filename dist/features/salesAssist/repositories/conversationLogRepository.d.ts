/**
 * Conversation Log Repository
 * Handles database operations for conversation logs
 */
/**
 * Create a new conversation log
 */
export declare const create: (data: any) => Promise<any>;
/**
 * Find conversation log by ID
 */
export declare const findById: (id: any) => Promise<any>;
/**
 * Find conversation logs by lead ID
 */
export declare const findByLeadId: (leadId: any) => Promise<any>;
/**
 * Update conversation log
 */
export declare const update: (id: any, data: any) => Promise<any>;
/**
 * Update all conversation logs for a lead when SalesOrder is created
 */
export declare const updateOnSalesOrderCreated: (leadId: any, salesOrderId: any) => Promise<import("mongoose").UpdateWriteOpResult>;
/**
 * Update all conversation logs for a lead when JobOrder is created
 * This confirms the sale is closed!
 */
export declare const updateOnJobOrderCreated: (leadId: any, jobOrderId: any) => Promise<import("mongoose").UpdateWriteOpResult>;
/**
 * Mark conversation as processed with extracted learnings
 */
export declare const markAsProcessed: (id: any, extractedLearnings: any) => Promise<any>;
/**
 * Find successful conversations for AI learning context
 * Returns conversations that led to actual sales
 */
export declare const findSuccessfulConversations: (options?: {}) => Promise<any>;
/**
 * Get learning statistics
 */
export declare const getLearningStats: () => Promise<any>;
/**
 * Find conversations by outcome
 */
export declare const findByOutcome: (outcome: any, options?: {}) => Promise<any>;
/**
 * Delete conversation log
 */
export declare const deleteById: (id: any) => Promise<any>;
//# sourceMappingURL=conversationLogRepository.d.ts.map