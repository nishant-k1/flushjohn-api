/**
 * Image Cleanup Cron Job Service
 * Run this as a separate process or use a cron job scheduler
 */

import cron from "node-cron";
import { deleteImageFromS3 } from "./imageCleanupService.js";
import { default: blogsRepository } from "../features/blogs/repositories/blogsRepository.js";

/**
 * Find and clean up orphaned images
 */
const cleanupOrphanedImages = async () => {
  try {
    console.log("🧹 Starting orphaned image cleanup...");
    
    // Get all blogs to find referenced images
    const blogs = await blogsRepository.findAll();
    const referencedImages = new Set();
    
    // Collect all referenced image URLs
    blogs.forEach(blog => {
      // Cover images
      if (blog.coverImage?.src) {
        referencedImages.add(blog.coverImage.src);
      }
      
      // Content images (extract from HTML content)
      if (blog.content) {
        const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let match;
        while ((match = imageRegex.exec(blog.content)) !== null) {
          referencedImages.add(match[1]);
        }
      }
    });
    
    console.log(`📊 Found ${referencedImages.size} referenced images`);
    
    // TODO: List all images from S3 and compare with referenced images
    // This would require S3 ListObjects operation
    // For now, this is a placeholder for the logic
    
    console.log("✅ Orphaned image cleanup completed");
  } catch (error) {
    console.error("❌ Error in orphaned image cleanup:", error);
  }
};

/**
 * Clean up old temporary images
 */
const cleanupTempImages = async () => {
  try {
    console.log("🧹 Starting temp image cleanup...");
    
    // Clean up images older than 24 hours that start with 'temp-'
    // This would require S3 ListObjects with date filtering
    // For now, this is a placeholder
    
    console.log("✅ Temp image cleanup completed");
  } catch (error) {
    console.error("❌ Error in temp image cleanup:", error);
  }
};

/**
 * Schedule cleanup jobs
 */
export const startCleanupJobs = () => {
  // Run every hour
  cron.schedule("0 * * * *", () => {
    console.log("⏰ Running hourly cleanup jobs...");
    cleanupOrphanedImages();
  });
  
  // Run every 6 hours
  cron.schedule("0 */6 * * *", () => {
    console.log("⏰ Running temp image cleanup...");
    cleanupTempImages();
  });
  
  console.log("✅ Cleanup cron jobs started");
};

/**
 * Manual cleanup trigger
 */
export const runManualCleanup = async () => {
  await cleanupOrphanedImages();
  await cleanupTempImages();
};
