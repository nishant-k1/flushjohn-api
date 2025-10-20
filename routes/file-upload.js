/**
 * File Upload Routes - Blog Images Only
 *
 * This file handles ONLY blog-related image uploads:
 * - Blog cover images (replacement with automatic cleanup)
 * - Blog content images (for rich text editor)
 *
 * PDF uploads are handled separately in other routes.
 */

import express from "express";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { queueImageCleanup } from "../services/imageCleanupQueue.js";
import {
  getBlogById,
  updateBlog,
} from "../features/blogs/services/blogsService.js";

const router = express.Router();

// Lazy initialization of S3 Client - Only create when needed
let s3Instance = null;

const getS3Client = () => {
  if (!s3Instance) {
    // Initializing S3 Client with credentials

    s3Instance = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Instance;
};

// **POST: Generate Upload URL (for new image upload) - Exact copy from original CRM**
router.post("/", async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        error: "Invalid request: Missing name or type",
      });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${name}`,
      ContentType: type, // Ensure this is a valid MIME type (e.g., "image/jpeg")
    };

    const command = new PutObjectCommand(params);

    const s3 = getS3Client();
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 seconds

    res.status(201).json({ uploadURL });
  } catch (error) {
    // Error generating upload URL
    res.status(500).json({
      error: "Could not generate upload URL",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// **PUT: Update an Image (Same as Upload) - Exact copy from original CRM**
router.put("/", async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        error: "Invalid request: Missing name or type",
      });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${name}`,
      ContentType: type, // Ensure this is a valid MIME type (e.g., "image/jpeg")
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 seconds

    res.status(200).json({ uploadURL });
  } catch (error) {
    res.status(500).json({
      error: "Could not generate upload URL for update",
    });
  }
});

// **POST: Upload Blog Content Images (bypasses CORS by uploading through API)**
router.post("/blog-content-image", async (req, res) => {
  try {
    const { name, type, fileData } = req.body;

    if (!name || !type || !fileData) {
      return res.status(400).json({
        error: "Invalid request: Missing name, type, or fileData",
      });
    }

    // Convert base64 to buffer if needed
    let fileBuffer;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      // Handle data URL format
      const base64Data = fileData.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (typeof fileData === "string") {
      // Handle plain base64
      fileBuffer = Buffer.from(fileData, "base64");
    } else {
      return res.status(400).json({
        error: "Invalid fileData format",
      });
    }

    // ✅ NEW APPROACH: Generate unique filename for content images
    const timestamp = Date.now();
    const fileExtension = type.split("/")[1] || "jpg";
    const fileName = `content-${timestamp}-${Math.random()
      .toString(36)
      .substr(2, 9)}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${fileName}`,
      Body: fileBuffer,
      ContentType: type,
      CacheControl: "public, max-age=31536000", // 1 year cache for images
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    // ✅ NEW APPROACH: No cache busting needed - new file = new URL
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const encodedName = encodeURIComponent(fileName);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}`;

    console.log("=== BLOG CONTENT IMAGE UPLOAD DEBUG ===");
    console.log("CloudFront URL env var:", cloudFrontUrl);
    console.log("Original file name:", name);
    console.log("New file name:", fileName);
    console.log("Encoded file name:", encodedName);
    console.log("Generated image URL:", imageUrl);
    console.log("Timestamp:", timestamp);
    console.log("=========================================");

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error("Direct upload error:", error);
    res.status(500).json({
      error: "Could not upload image",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// **PUT: Replace Blog Cover Image (uses new file approach with automatic cleanup)**
router.put("/blog-cover-image", async (req, res) => {
  try {
    const { blogId, type, fileData } = req.body;

    if (!blogId) {
      return res.status(400).json({
        error: "Invalid request: Missing blogId",
      });
    }

    // Handle deletion case (fileData is null)
    if (fileData === null) {
      console.log(`Deleting cover image for blog ${blogId}`);

      // Try common image extensions
      const extensions = ["jpg", "jpeg", "png", "gif", "webp"];
      let deleted = false;

      for (const ext of extensions) {
        const fileName = `cover-${blogId}.${ext}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `images/blog/${fileName}`,
        };

        try {
          const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
          const command = new DeleteObjectCommand(params);
          const s3 = getS3Client();
          await s3.send(command);
          console.log(`Cover image deleted from S3: ${fileName}`);
          deleted = true;
          break;
        } catch (error) {
          // Continue to next extension if file not found
          if (error.name !== "NoSuchKey") {
            console.error(`Error deleting cover image ${fileName}:`, error);
          }
        }
      }

      // Update database to remove cover image
      try {
        const { default: blogsService } = await import(
          "../features/blogs/services/blogsService.js"
        );
        await blogsService.updateBlog(blogId, { coverImage: null });
        console.log(`Cover image removed from database for blog ${blogId}`);
      } catch (dbError) {
        console.error("Error updating database:", dbError);
      }

      return res.status(200).json({
        message: "Cover image deleted successfully",
        success: true,
      });
    }

    // Handle upload/replacement case
    if (!type || !fileData) {
      return res.status(400).json({
        error: "Invalid request: Missing type or fileData for upload",
      });
    }

    // Convert base64 to buffer if needed
    let fileBuffer;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      // Handle data URL format
      const base64Data = fileData.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (typeof fileData === "string") {
      // Handle plain base64
      fileBuffer = Buffer.from(fileData, "base64");
    } else {
      return res.status(400).json({
        error: "Invalid fileData format",
      });
    }

    // ✅ NEW APPROACH: Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = type.split("/")[1] || "jpg";
    const fileName = `cover-${blogId}-${timestamp}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${fileName}`,
      Body: fileBuffer,
      ContentType: type,
      CacheControl: "public, max-age=31536000", // 1 year cache for images
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    // ✅ NEW APPROACH: No cache busting needed - new file = new URL
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const encodedName = encodeURIComponent(fileName);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}`;

    // Get existing blog for cleanup
    let existingBlog = null;
    try {
      existingBlog = await getBlogById(blogId);

      // Update database with new cover image URL
      console.log(`Updating database for blog ${blogId} with cover image:`, {
        src: imageUrl,
        alt: "Cover Image",
      });

      const updatedBlog = await updateBlog(blogId, {
        coverImage: {
          src: imageUrl,
          alt: "Cover Image",
        },
      });

      console.log(`Cover image URL updated in database for blog ${blogId}`);
      console.log(`Updated blog coverImage:`, updatedBlog?.coverImage);
    } catch (dbError) {
      console.error("Error updating database:", dbError);
    }

    // ✅ NEW APPROACH: Queue cleanup of old image (with 5 second delay)
    if (existingBlog?.coverImage?.src) {
      await queueImageCleanup(existingBlog.coverImage.src, 5000);
    }

    console.log("=== BLOG COVER IMAGE REPLACEMENT DEBUG ===");
    console.log("Blog ID:", blogId);
    console.log("New file name:", fileName);
    console.log("New image URL:", imageUrl);
    console.log("Old image URL:", existingBlog?.coverImage?.src);
    console.log("Timestamp:", timestamp);
    console.log("===========================================");

    res.status(200).json({
      message: "Cover image replaced successfully",
      imageUrl: imageUrl,
      fileName: fileName,
      success: true,
    });
  } catch (error) {
    console.error("Cover image replacement error:", error);
    res.status(500).json({
      error: "Could not replace cover image",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// **DELETE: Remove an Image from S3 - Exact copy from original CRM**
router.delete("/", async (req, res) => {
  try {
    const { name } = req.body; // Read JSON body

    if (!name) {
      return res.status(400).json({ error: "Filename missing" });
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${name}`,
    };

    const command = new DeleteObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not delete image",
    });
  }
});

export default router;
