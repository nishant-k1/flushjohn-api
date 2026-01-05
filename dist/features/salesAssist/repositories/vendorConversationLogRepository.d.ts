/**
 * Vendor Conversation Log Repository
 * Handles database operations for vendor conversation logs
 */
/**
 * Create a new vendor conversation log
 */
export declare const create: (data: any) => Promise<any>;
/**
 * Find vendor conversation log by ID
 */
export declare const findById: (id: any) => Promise<any>;
/**
 * Find all unprocessed vendor conversations for AI learning
 */
export declare const findUnprocessed: (limit?: number) => Promise<any>;
/**
 * Mark a conversation as processed
 */
export declare const markAsProcessed: (id: any, extractedLearnings: any) => Promise<any>;
/**
 * Find processed conversations for AI learning context
 * Returns conversations with extracted learnings
 */
export declare const findProcessedForLearning: (options?: {}) => Promise<any>;
/**
 * Get all effective phrases from processed conversations
 */
export declare const getEffectivePhrases: (limit?: number) => Promise<any[]>;
/**
 * Get all negotiation tactics from processed conversations
 */
export declare const getNegotiationTactics: (limit?: number) => Promise<any[]>;
/**
 * Get vendor learning statistics
 */
export declare const getLearningStats: () => Promise<any>;
/**
 * Delete vendor conversation log
 */
export declare const deleteById: (id: any) => Promise<any>;
//# sourceMappingURL=vendorConversationLogRepository.d.ts.map