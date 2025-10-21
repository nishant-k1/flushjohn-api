/**
 * S3 Lifecycle Policy Setup Script
 * Run this once to configure S3 lifecycle policies for automatic cleanup
 */

import {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";

const getS3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

/**
 * Setup S3 lifecycle policies for automatic image cleanup
 */
export const setupS3LifecyclePolicies = async () => {
  try {
    const s3 = getS3Client();

    const lifecycleConfig = {
      Rules: [
        {
          ID: "DeleteOldCoverImages",
          Status: "Enabled",
          Filter: {
            Prefix: "images/blog/cover-",
          },
          Expiration: {
            Days: 30, // Delete after 30 days
          },
          NoncurrentVersionExpiration: {
            NoncurrentDays: 7, // Delete old versions after 7 days
          },
        },
        {
          ID: "DeleteOldContentImages",
          Status: "Enabled",
          Filter: {
            Prefix: "images/blog/content-",
          },
          Expiration: {
            Days: 90, // Delete after 90 days
          },
        },
        {
          ID: "DeleteTempImages",
          Status: "Enabled",
          Filter: {
            Prefix: "images/temp/",
          },
          Expiration: {
            Days: 1, // Delete temp images after 1 day
          },
        },
      ],
    };

    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      LifecycleConfiguration: lifecycleConfig,
    });

    await s3.send(command);

    console.log("✅ S3 lifecycle policies configured successfully");
    console.log("📋 Policies:");
    console.log("  - Cover images: Delete after 30 days");
    console.log("  - Content images: Delete after 90 days");
    console.log("  - Temp images: Delete after 1 day");
  } catch (error) {
    console.error("❌ Error setting up S3 lifecycle policies:", error);
    throw error;
  }
};

/**
 * Alternative: Setup lifecycle policy for specific patterns
 */
export const setupSmartLifecyclePolicy = async () => {
  try {
    const s3 = getS3Client();

    const lifecycleConfig = {
      Rules: [
        {
          ID: "SmartImageCleanup",
          Status: "Enabled",
          Filter: {
            Prefix: "images/blog/",
          },
          Expiration: {
            Days: 60, // Delete all blog images after 60 days
          },
          NoncurrentVersionExpiration: {
            NoncurrentDays: 1, // Delete old versions immediately
          },
        },
      ],
    };

    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      LifecycleConfiguration: lifecycleConfig,
    });

    await s3.send(command);

    console.log("✅ Smart S3 lifecycle policy configured");
    console.log("📋 Policy: Delete all blog images after 60 days");
  } catch (error) {
    console.error("❌ Error setting up smart lifecycle policy:", error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupS3LifecyclePolicies()
    .then(() => {
      console.log("✅ Setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}
