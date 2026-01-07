/**
 * Image Cleanup Cron Job Service
 * Run this as a separate process or use a cron job scheduler
 */

import cron from "node-cron";
import { deleteImageFromS3 } from "./imageCleanupService.js";
import * as blogsRepository from "../../blogs/repositories/blogsRepository.js";

/**
 * Find and clean up orphaned images
 */
const cleanupOrphanedImages = async () => {
  try {
    const blogs = await blogsRepository.findAll({
      query: {},
      sort: {},
      skip: 0,
      limit: 1000,
    });
    const referencedImages = new Set();

    blogs.forEach((blog) => {
      if (blog.coverImage?.src) {
        referencedImages.add(blog.coverImage.src);
      }

      if (blog.content) {
        const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = imageRegex.exec(blog.content)) !== null) {
          referencedImages.add(match[1]);
        }
      }
    });
  } catch (error) {
    console.error("❌ Error in orphaned image cleanup:", error);
  }
};

/**
 * Clean up old temporary images
 */
const cleanupTempImages = async () => {
  try {
  } catch (error) {
    console.error("❌ Error in temp image cleanup:", error);
  }
};

/**
 * Schedule cleanup jobs
 */
export const startCleanupJobs = () => {
  cron.schedule("0 * * * *", () => {
    cleanupOrphanedImages();
  });

  cron.schedule("0 */6 * * *", () => {
    cleanupTempImages();
  });
};

/**
 * Manual cleanup trigger
 */
export const runManualCleanup = async () => {
  await cleanupOrphanedImages();
  await cleanupTempImages();
};
