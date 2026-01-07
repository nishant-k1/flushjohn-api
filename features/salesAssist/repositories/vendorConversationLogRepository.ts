/**
 * Vendor Conversation Log Repository
 * Handles database operations for vendor conversation logs
 */

import VendorConversationLog from "../models/VendorConversationLog.js";

/**
 * Create a new vendor conversation log
 */
export const create = async (data) => {
  const log = new VendorConversationLog(data);
  return await log.save();
};

/**
 * Find vendor conversation log by ID
 */
export const findById = async (id) => {
  return await (VendorConversationLog as any).findById(id);
};

/**
 * Find all unprocessed vendor conversations for AI learning
 */
export const findUnprocessed = async (limit = 10) => {
  return await (VendorConversationLog as any)
    .find({ processed: false })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Mark a conversation as processed
 */
export const markAsProcessed = async (id, extractedLearnings) => {
  return await (VendorConversationLog as any).findByIdAndUpdate(
    id,
    {
      processed: true,
      processedAt: new Date(),
      extractedLearnings,
    },
    { new: true }
  );
};

/**
 * Find processed conversations for AI learning context
 * Returns conversations with extracted learnings
 */
export const findProcessedForLearning = async (options: any = {}) => {
  const { limit = 10, daysBack = 60 } = options;

  return await (VendorConversationLog as any)
    .find({
      processed: true,
      createdAt: {
        $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
      },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("extractedLearnings transcript createdAt");
};

/**
 * Get all effective phrases from processed conversations
 */
export const getEffectivePhrases = async (limit = 50) => {
  const conversations = await (VendorConversationLog as any)
    .find({
      processed: true,
      "extractedLearnings.effectivePhrases": { $exists: true, $ne: [] },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("extractedLearnings.effectivePhrases");

  const phrases = [];
  conversations.forEach((c) => {
    if (c.extractedLearnings?.effectivePhrases) {
      phrases.push(...c.extractedLearnings.effectivePhrases);
    }
  });

  // Return unique phrases
  return [...new Set(phrases)];
};

/**
 * Get all negotiation tactics from processed conversations
 */
export const getNegotiationTactics = async (limit = 50) => {
  const conversations = await (VendorConversationLog as any)
    .find({
      processed: true,
      "extractedLearnings.negotiationTactics": { $exists: true, $ne: [] },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("extractedLearnings.negotiationTactics");

  const tactics = [];
  conversations.forEach((c) => {
    if (c.extractedLearnings?.negotiationTactics) {
      tactics.push(...c.extractedLearnings.negotiationTactics);
    }
  });

  return [...new Set(tactics)];
};

/**
 * Get vendor learning statistics
 */
export const getLearningStats = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const stats = await (VendorConversationLog as any).aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        processedConversations: {
          $sum: { $cond: ["$processed", 1, 0] },
        },
        totalWords: { $sum: "$wordCount" },
        avgWordCount: { $avg: "$wordCount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalConversations: 0,
      processedConversations: 0,
      totalWords: 0,
      avgWordCount: 0,
    }
  );
};

/**
 * Delete vendor conversation log
 */
export const deleteById = async (id) => {
  return await (VendorConversationLog as any).findByIdAndDelete(id);
};
