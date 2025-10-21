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

let s3Instance = null;

const getS3Client = () => {
  if (!s3Instance) {
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
      ContentType: type,
    };

    const command = new PutObjectCommand(params);

    const s3 = getS3Client();
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.status(201).json({ uploadURL });
  } catch (error) {
    res.status(500).json({
      error: "Could not generate upload URL",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

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
      ContentType: type,
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

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

    let fileBuffer;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const base64Data = fileData.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (typeof fileData === "string") {
      fileBuffer = Buffer.from(fileData, "base64");
    } else {
      return res.status(400).json({
        error: "Invalid fileData format",
      });
    }

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
      CacheControl: "public, max-age=31536000",
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const encodedName = encodeURIComponent(fileName);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}`;

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      fileName: fileName,
    });
  } catch (error) {
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
      // Try common image extensions
      const extensions = ["jpg", "jpeg", "png", "gif", "webp"];
      let deleted = false;

      // Try to delete both old format (without timestamp) and new format (with timestamp)
      const fileNamePatterns = [
        `cover-${blogId}`, // Old format without timestamp
        `cover-${blogId}-*`, // New format with timestamp (we'll use ListObjects to find exact files)
      ];

      // First, try old format files
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
          deleted = true;
          break;
        } catch (error) {
          if (error.name === "NoSuchKey") {
            // File doesn't exist, continue to next extension
            continue;
          } else {
            // Real S3 error occurred, log it and continue to next extension
            console.error(`Error deleting cover image ${fileName}:`, error);
            continue;
          }
        }
      }

      // If old format not found, try to find and delete new format files with timestamp
      if (!deleted) {
        try {
          const { ListObjectsV2Command, DeleteObjectCommand } = await import(
            "@aws-sdk/client-s3"
          );
          const listParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Prefix: `images/blog/cover-${blogId}-`,
          };

          const s3 = getS3Client();
          const listCommand = new ListObjectsV2Command(listParams);
          const listResponse = await s3.send(listCommand);

          if (listResponse.Contents && listResponse.Contents.length > 0) {
            for (const object of listResponse.Contents) {
              const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: object.Key,
              };
              const deleteCommand = new DeleteObjectCommand(deleteParams);
              await s3.send(deleteCommand);
              deleted = true;
            }
          }
        } catch (error) {
          console.error(
            `Error deleting timestamped cover images for blog ${blogId}:`,
            error
          );
        }
      }

      try {
        const { updateBlog } = await import(
          "../features/blogs/services/blogsService.js"
        );
        await updateBlog(blogId, { coverImage: null });
      } catch (dbError) {
        console.error("Error updating database:", dbError);
        return res.status(500).json({
          error: "Failed to update database",
          message: "Cover image deleted from S3 but database update failed",
        });
      }

      return res.status(200).json({
        message: "Cover image deleted successfully",
        success: true,
      });
    }

    if (!type || !fileData) {
      return res.status(400).json({
        error: "Invalid request: Missing type or fileData for upload",
      });
    }

    let fileBuffer;
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const base64Data = fileData.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (typeof fileData === "string") {
      fileBuffer = Buffer.from(fileData, "base64");
    } else {
      return res.status(400).json({
        error: "Invalid fileData format",
      });
    }

    const timestamp = Date.now();
    const fileExtension = type.split("/")[1] || "jpg";
    const fileName = `cover-${blogId}-${timestamp}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${fileName}`,
      Body: fileBuffer,
      ContentType: type,
      CacheControl: "public, max-age=31536000",
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const encodedName = encodeURIComponent(fileName);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}`;

    let existingBlog = null;
    try {
      existingBlog = await getBlogById(blogId);

      await updateBlog(blogId, {
        coverImage: {
          src: imageUrl,
          alt: "Cover Image",
        },
      });
    } catch (dbError) {
      console.error("Error updating database:", dbError);
      return res.status(500).json({
        error: "Failed to update database",
        message: "Cover image uploaded to S3 but database update failed",
      });
    }

    if (existingBlog?.coverImage?.src) {
      await queueImageCleanup(existingBlog.coverImage.src, 5000);
    }

    res.status(200).json({
      message: "Cover image replaced successfully",
      imageUrl: imageUrl,
      fileName: fileName,
      success: true,
    });
  } catch (error) {
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
