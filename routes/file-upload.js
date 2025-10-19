import express from "express";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

// **POST: Direct Upload (bypasses CORS by uploading through API)**
router.post("/direct", async (req, res) => {
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

    // Use timestamp for cache busting (like PDF uploads)
    const timestamp = Date.now();

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${name}`,
      Body: fileBuffer,
      ContentType: type,
      // Add cache control headers like PDF uploads
      CacheControl: "public, max-age=31536000", // 1 year cache for images
      ContentDisposition: "inline",
    };

    const command = new PutObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    // Return the public URL with cache busting (like PDF uploads)
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    // URL encode the filename to handle special characters
    const encodedName = encodeURIComponent(name);
    const imageUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/images/blog/${encodedName}?t=${timestamp}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/images/blog/${encodedName}?t=${timestamp}`;

    console.log("=== IMAGE UPLOAD DEBUG ===");
    console.log("CloudFront URL env var:", cloudFrontUrl);
    console.log("Original file name:", name);
    console.log("Encoded file name:", encodedName);
    console.log("Generated image URL:", imageUrl);
    console.log("Timestamp:", timestamp);
    console.log("=========================");

    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      fileName: name,
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
