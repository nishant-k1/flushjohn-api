/**
 * Blog Image Cleanup Service - Handles cleanup of old/unused blog images from S3
 *
 * This service is specifically for blog-related images:
 * - Blog cover images
 * - Blog content images
 *
 * PDF cleanup is handled separately.
 */

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

/**
 * Extract S3 key from CDN URL
 * @param {string} cdnUrl - CDN URL like https://cdn.myapp.com/images/blog/cover-123-1698347429.jpg
 * @returns {string} - S3 key like images/blog/cover-123-1698347429.jpg
 */
const extractS3KeyFromUrl = (cdnUrl) => {
  try {
    const url = new URL(cdnUrl);
    const pathname = url.pathname;

    // Remove leading slash and extract path after domain
    const s3Key = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    return s3Key;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", cdnUrl, error);
    return null;
  }
};

/**
 * Delete image from S3
 * @param {string} imageUrl - Full CDN URL of the image
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImageFromS3 = async (imageUrl) => {
  try {
    const s3Key = extractS3KeyFromUrl(imageUrl);

    if (!s3Key) {
      console.error("Could not extract S3 key from URL:", imageUrl);
      return false;
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    };

    const command = new DeleteObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    console.log(`✅ Image deleted from S3: ${s3Key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting image from S3: ${imageUrl}`, error);
    return false;
  }
};

// Note: scheduleImageCleanup function removed - now using queue-based approach

/**
 * Clean up multiple images
 * @param {string[]} imageUrls - Array of image URLs to clean up
 * @returns {Promise<Object>} - Cleanup results
 */
export const cleanupMultipleImages = async (imageUrls) => {
  const results = {
    successful: [],
    failed: [],
    total: imageUrls.length,
  };

  for (const imageUrl of imageUrls) {
    try {
      const success = await deleteImageFromS3(imageUrl);
      if (success) {
        results.successful.push(imageUrl);
      } else {
        results.failed.push(imageUrl);
      }
    } catch (error) {
      console.error(`Error cleaning up image ${imageUrl}:`, error);
      results.failed.push(imageUrl);
    }
  }

  console.log(
    `✅ Cleanup completed: ${results.successful.length}/${results.total} successful`
  );
  return results;
};

/**
 * Clean up orphaned images (images not referenced in any blog)
 * @param {Array} allImageUrls - All image URLs from database
 * @returns {Promise<Object>} - Cleanup results
 */
export const cleanupOrphanedImages = async (allImageUrls) => {
  // This would require checking which images are still referenced in blogs
  // Implementation depends on your database structure
  console.log("Orphaned image cleanup not implemented yet");
  return { successful: [], failed: [], total: 0 };
};
