import { deleteImageFromS3 } from "./imageCleanupService.js";

const cleanupQueue = [];
const processingQueue = new Set();

export const queueImageCleanup = async (imageUrl, delay = 0) => {
  const cleanupTask = {
    imageUrl,
    delay,
    createdAt: Date.now(),
    attempts: 0,
    maxAttempts: 3,
  };

  if (delay > 0) {
    // Delayed cleanup - add to queue after delay
    setTimeout(() => {
      cleanupQueue.push(cleanupTask);
      if (!processingQueue.has("cleanup")) {
        processCleanupQueue();
      }
    }, delay);
  } else {
    // Immediate cleanup
    cleanupQueue.push(cleanupTask);
    if (!processingQueue.has("cleanup")) {
      processCleanupQueue();
    }
  }
};

const processCleanupQueue = async () => {
  if (processingQueue.has("cleanup") || cleanupQueue.length === 0) {
    return;
  }

  processingQueue.add("cleanup");

  while (cleanupQueue.length > 0) {
    const task = cleanupQueue.shift();

    try {
      const success = await deleteImageFromS3(task.imageUrl);

      if (success) {
      } else {
        task.attempts++;
        if (task.attempts < task.maxAttempts) {
          cleanupQueue.push(task);

          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, task.attempts) * 1000)
          );
        } else {
        }
      }
    } catch (error) {
      task.attempts++;
      if (task.attempts < task.maxAttempts) {
        cleanupQueue.push(task);
      }
    }
  }

  processingQueue.delete("cleanup");
};

export const queueMultipleImageCleanup = async (imageUrls, delay = 1000) => {
  for (let i = 0; i < imageUrls.length; i++) {
    await queueImageCleanup(imageUrls[i], i * delay);
  }
};

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
