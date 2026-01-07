import express from "express";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

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

router.get("/", async (req, res) => {
  try {
    const s3Client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const command = new GetBucketCorsCommand({
      Bucket: bucketName,
    });

    const corsConfig = await s3Client.send(command);
    
    res.status(200).json({
      success: true,
      message: "S3 CORS configuration retrieved successfully",
      corsConfiguration: corsConfig.CORSRules || [],
    });
  } catch (error) {
    console.error("Error getting S3 CORS configuration:", error);
    
    if (error.name === "NoSuchCORSConfiguration") {
      res.status(200).json({
        success: true,
        message: "No CORS configuration found",
        corsConfiguration: [],
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Could not retrieve S3 CORS configuration",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { allowedOrigins } = req.body;
    
    const defaultOrigins = [
      "http://localhost:3001",
      "http://localhost:3000",
      process.env.PRODUCTION_DOMAIN || "https://your-production-domain.com"
    ];
    
    const origins = allowedOrigins && Array.isArray(allowedOrigins) 
      ? [...allowedOrigins, ...defaultOrigins.filter(origin => !allowedOrigins.includes(origin))]
      : defaultOrigins;

    const s3Client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const corsConfig = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
            AllowedOrigins: origins,
            ExposeHeaders: ["ETag", "x-amz-version-id"],
            MaxAgeSeconds: 86400, // 24 hours for better caching
          },
        ],
      },
    };

    const command = new PutBucketCorsCommand(corsConfig);
    await s3Client.send(command);
    
    
    res.status(200).json({
      success: true,
      message: "S3 CORS configuration updated successfully",
      allowedOrigins: origins,
      corsConfiguration: corsConfig.CORSConfiguration.CORSRules,
    });
  } catch (error) {
    console.error("Error setting S3 CORS configuration:", error);
    
    res.status(500).json({
      success: false,
      error: "Could not update S3 CORS configuration",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/setup-dev", async (req, res) => {
  try {
    const s3Client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const corsConfig = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
            AllowedOrigins: [
              "http://localhost:3001",
              "http://localhost:3000",
              "http://127.0.0.1:3001",
              "http://127.0.0.1:3000",
              ...(process.env.PRODUCTION_DOMAIN ? [process.env.PRODUCTION_DOMAIN] : [])
            ],
            ExposeHeaders: ["ETag", "x-amz-version-id"],
            MaxAgeSeconds: 86400, // 24 hours for better caching
          },
        ],
      },
    };

    const command = new PutBucketCorsCommand(corsConfig);
    await s3Client.send(command);
    
    
    res.status(200).json({
      success: true,
      message: "S3 CORS configuration set up for development",
      corsConfiguration: corsConfig.CORSConfiguration.CORSRules,
    });
  } catch (error) {
    console.error("Error setting up S3 CORS for development:", error);
    
    res.status(500).json({
      success: false,
      error: "Could not set up S3 CORS for development",
      message: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
