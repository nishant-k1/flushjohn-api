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
    console.log("🔧 Initializing S3 Client with:");
    console.log("- Region:", process.env.AWS_REGION || "NOT SET");
    console.log("- Bucket:", process.env.AWS_S3_BUCKET_NAME || "NOT SET");
    console.log(
      "- Access Key ID:",
      process.env.AWS_ACCESS_KEY_ID
        ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...`
        : "NOT SET"
    );
    console.log(
      "- Secret Access Key:",
      process.env.AWS_SECRET_ACCESS_KEY ? "***SET***" : "NOT SET"
    );

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
    console.log("📤 File upload request received");
    console.log("Request body:", req.body);

    const { name, type } = req.body;

    if (!name || !type) {
      console.error("❌ Missing name or type in request");
      return res.status(400).json({
        error: "Invalid request: Missing name or type",
      });
    }

    console.log("S3 Config:");
    console.log("- Bucket:", process.env.AWS_S3_BUCKET_NAME);
    console.log("- Region:", process.env.AWS_REGION);
    console.log("- Key:", `images/blog/${name}`);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/blog/${name}`,
      ContentType: type, // Ensure this is a valid MIME type (e.g., "image/jpeg")
    };

    const command = new PutObjectCommand(params);
    console.log("Generating signed URL...");
    const s3 = getS3Client();
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 seconds

    console.log("✅ Upload URL generated successfully");
    res.status(201).json({ uploadURL });
  } catch (error) {
    console.error("❌ Error generating upload URL:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
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
    const s3 = getS3Client();
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
