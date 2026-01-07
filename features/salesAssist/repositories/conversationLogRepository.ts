/**
 * Conversation Log Repository
 * Handles database operations for conversation logs
 */

import ConversationLog from "../models/ConversationLog.js";

/**
 * Create a new conversation log
 */
export const create = async (data) => {
  const log = new ConversationLog(data);
  return await log.save();
};

/**
 * Find conversation log by ID
 */
export const findById = async (id) => {
  return await (ConversationLog as any).findById(id);
};

/**
 * Find conversation logs by lead ID
 */
export const findByLeadId = async (leadId) => {
  return await (ConversationLog as any)
    .find({ lead: leadId })
    .sort({ createdAt: -1 });
};

/**
 * Update conversation log
 */
export const update = async (id, data) => {
  return await (ConversationLog as any).findByIdAndUpdate(id, data, {
    new: true,
  });
};

/**
 * Update all conversation logs for a lead when SalesOrder is created
 */
export const updateOnSalesOrderCreated = async (leadId, salesOrderId) => {
  return await (ConversationLog as any).updateMany(
    { lead: leadId },
    {
      salesOrderId: salesOrderId,
      outcome: "converted",
    }
  );
};

/**
 * Update all conversation logs for a lead when JobOrder is created
 * This confirms the sale is closed!
 */
export const updateOnJobOrderCreated = async (leadId, jobOrderId) => {
  return await (ConversationLog as any).updateMany(
    { lead: leadId },
    {
      jobOrderId: jobOrderId,
      conversionSuccess: true, // Gold standard - sale actually closed!
    }
  );
};

/**
 * Mark conversation as processed with extracted learnings
 */
export const markAsProcessed = async (id, extractedLearnings) => {
  return await (ConversationLog as any).findByIdAndUpdate(
    id,
    {
      extractedLearnings,
      processed: true,
      processedAt: new Date(),
    },
    { new: true }
  );
};

/**
 * Find successful conversations for AI learning context
 * Returns conversations that led to actual sales
 */
export const findSuccessfulConversations = async (options: any = {}) => {
  const { limit = 10, daysBack = 30, eventType = null, state = null } = options;

  const query = {
    conversionSuccess: true,
    createdAt: {
      $gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
    },
  };

  if (eventType) {
    query["extractedInfo.eventType"] = eventType;
  }

  if (state) {
    query["extractedInfo.location.state"] = state;
  }

  return await (ConversationLog as any)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "transcript extractedInfo quotedPrice pricingBreakdown successfulResponses effectiveTactics"
    );
};

/**
 * Get learning statistics
 */
export const getLearningStats = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const stats = await (ConversationLog as any).aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        successfulConversions: {
          $sum: { $cond: ["$conversionSuccess", 1, 0] },
        },
        avgQuotedPrice: {
          $avg: { $cond: ["$quotedPrice", "$quotedPrice", null] },
        },
        conversionRate: {
          $avg: { $cond: ["$conversionSuccess", 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalConversations: 0,
      successfulConversions: 0,
      avgQuotedPrice: 0,
      conversionRate: 0,
    }
  );
};

/**
 * Find conversations by outcome
 */
export const findByOutcome = async (outcome, options: any = {}) => {
  const { limit = 20, skip = 0 } = options;

  return await (ConversationLog as any)
    .find({ outcome })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Delete conversation log
 */
export const deleteById = async (id) => {
  return await (ConversationLog as any).findByIdAndDelete(id);
};
