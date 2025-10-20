/**
 * Blog Image Cleanup Queue Service - Background cleanup with retry logic
 *
 * This service handles background cleanup of blog-related images:
 * - Blog cover images (when replaced)
 * - Blog content images (when orphaned)
 *
 * PDF cleanup is handled separately.
 */

import { deleteImageFromS3 } from "./imageCleanupService.js";

// Simple in-memory queue (for production, use Redis/Bull/Agenda)
const cleanupQueue = [];
const processingQueue = new Set();

/**
 * Add image to cleanup queue
 * @param {string} imageUrl - Image URL to clean up
 * @param {number} delay - Delay in milliseconds before cleanup
 */
export const queueImageCleanup = async (imageUrl, delay = 0) => {
  const cleanupTask = {
    imageUrl,
    delay,
    createdAt: Date.now(),
    attempts: 0,
    maxAttempts: 3,
  };

  if (delay > 0) {
    // Delayed cleanup
    setTimeout(() => {
      processCleanupQueue();
    }, delay);
  }

  cleanupQueue.push(cleanupTask);
  console.log(`📋 Image queued for cleanup: ${imageUrl}`);

  // Process queue if not already processing
  if (!processingQueue.has("cleanup")) {
    processCleanupQueue();
  }
};

/**
 * Process cleanup queue
 */
const processCleanupQueue = async () => {
  if (processingQueue.has("cleanup") || cleanupQueue.length === 0) {
    return;
  }

  processingQueue.add("cleanup");

  while (cleanupQueue.length > 0) {
    const task = cleanupQueue.shift();

    try {
      console.log(`🔄 Processing cleanup: ${task.imageUrl}`);

      const success = await deleteImageFromS3(task.imageUrl);

      if (success) {
        console.log(`✅ Cleanup successful: ${task.imageUrl}`);
      } else {
        // Retry logic
        task.attempts++;
        if (task.attempts < task.maxAttempts) {
          console.log(
            `🔄 Retrying cleanup (${task.attempts}/${task.maxAttempts}): ${task.imageUrl}`
          );
          cleanupQueue.push(task);

          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, task.attempts) * 1000)
          );
        } else {
          console.error(
            `❌ Cleanup failed after ${task.maxAttempts} attempts: ${task.imageUrl}`
          );
        }
      }
    } catch (error) {
      console.error(`❌ Cleanup error: ${task.imageUrl}`, error);

      // Retry logic
      task.attempts++;
      if (task.attempts < task.maxAttempts) {
        cleanupQueue.push(task);
      }
    }
  }

  processingQueue.delete("cleanup");
};

/**
 * Clean up multiple images with delay
 * @param {string[]} imageUrls - Array of image URLs
 * @param {number} delay - Delay between cleanups in milliseconds
 */
export const queueMultipleImageCleanup = async (imageUrls, delay = 1000) => {
  for (let i = 0; i < imageUrls.length; i++) {
    await queueImageCleanup(imageUrls[i], i * delay);
  }
};

/**
 * Get queue status
 */
export const getQueueStatus = () => {
  return {
    pending: cleanupQueue.length,
    processing: processingQueue.size,
    queue: cleanupQueue.map((task) => ({
      imageUrl: task.imageUrl,
      attempts: task.attempts,
      age: Date.now() - task.createdAt,
    })),
  };
};

// Process queue every 30 seconds
setInterval(() => {
  if (cleanupQueue.length > 0) {
    processCleanupQueue();
  }
}, 30000);
