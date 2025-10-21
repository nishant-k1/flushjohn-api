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

const extractS3KeyFromUrl = (cdnUrl) => {
  try {
    const url = new URL(cdnUrl);
    const pathname = url.pathname;

    const s3Key = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    return s3Key;
  } catch (error) {
    return null;
  }
};

export const deleteImageFromS3 = async (imageUrl) => {
  try {
    const s3Key = extractS3KeyFromUrl(imageUrl);

    if (!s3Key) {
      return false;
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    };

    const command = new DeleteObjectCommand(params);
    const s3 = getS3Client();
    await s3.send(command);

    return true;
  } catch (error) {
    return false;
  }
};

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
      results.failed.push(imageUrl);
    }
  }

  return results;
};

export const cleanupOrphanedImages = async (allImageUrls) => {
  return { successful: [], failed: [], total: 0 };
};
