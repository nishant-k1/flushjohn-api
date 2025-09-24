import express from "express";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

// Initialize S3 Client - Exact copy from original CRM
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 seconds

    res.status(201).json({ uploadURL });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({
      error: "Could not generate upload URL",
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
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 seconds

    res.status(200).json({ uploadURL });
  } catch (error) {
    console.error("Error generating upload URL for update:", error);
    res.status(500).json({
      error: "Could not generate upload URL for update",
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
    await s3.send(command);

    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      error: "Could not delete image",
    });
  }
});

export default router;
