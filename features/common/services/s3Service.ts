import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3 = null;
let BUCKET_NAME = null;

const getS3Client = () => {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3;
};

const getBucketName = () => {
  if (!BUCKET_NAME) {
    BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
  }
  return BUCKET_NAME;
};

/**
 * Upload PDF to S3 - one unique file per document type and ID
 * Example: quote-123.pdf (will overwrite on regeneration)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
 * @param {string} documentId - Document ID (unique per user/document)
 * @returns {Promise<Object>} - Object with directUrl, cdnUrl, s3Key, and fileName
 */
export const uploadPDFToS3 = async (pdfBuffer, documentType, documentId) => {
  try {
    // Validate AWS configuration
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS credentials. Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
    }

    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("Missing AWS_S3_BUCKET_NAME environment variable.");
    }

    if (!process.env.AWS_REGION) {
      throw new Error("Missing AWS_REGION environment variable.");
    }

    const fileName = `${documentType}-${documentId}.pdf`;
    const key = `pdfs/${fileName}`;
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    if (!bucketName) {
      throw new Error("AWS_S3_BUCKET_NAME is not configured.");
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ContentDisposition: "inline",
      CacheControl: "no-store, no-cache, must-revalidate, max-age=0",
      Expires: new Date(0), // Expire immediately
    };

    const command = new PutObjectCommand(uploadParams);

    try {
      await s3Client.send(command);
    } catch (uploadError) {
      // Enhance S3 upload errors with more context
      const errorMessage = uploadError.message || String(uploadError);
      if (uploadError.name === "InvalidAccessKeyId" || uploadError.name === "SignatureDoesNotMatch") {
        throw new Error(`AWS authentication failed: ${errorMessage}. Please check AWS credentials.`);
      } else if (uploadError.name === "NoSuchBucket") {
        throw new Error(`S3 bucket not found: ${bucketName}. Please check AWS_S3_BUCKET_NAME.`);
      } else if (uploadError.name === "AccessDenied") {
        throw new Error(`Access denied to S3 bucket: ${bucketName}. Please check IAM permissions.`);
      }
      throw new Error(`S3 upload failed: ${errorMessage}`);
    }

    const cloudFrontUrl = process.env.CLOUDFRONT_URL;

    const timestamp = Date.now();

    const s3DirectUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}?t=${timestamp}`;
    const pdfUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/${key}?t=${timestamp}` // CloudFront CDN (preferred)
      : s3DirectUrl; // Direct S3 URL (fallback)

    const result = {
      fileName: fileName,
      s3Key: key,
      cdnUrl: pdfUrl, // Single URL for all use cases
    };

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete PDF from S3 by full key/filename
 * @param {string} pdfKey - Full S3 key (e.g., 'pdfs/jobOrder-123-1234567890.pdf')
 * @returns {Promise<boolean>} - Success status
 */
export const deletePDFFromS3 = async (pdfKey) => {
  try {
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    const deleteParams = {
      Bucket: bucketName,
      Key: pdfKey,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get signed URL for PDF access
 * @param {string} pdfKey - Full S3 key (e.g., 'pdfs/jobOrder-123-1234567890.pdf')
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
export const getPDFSignedUrl = async (pdfKey, expiresIn = 3600) => {
  try {
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    const getParams = {
      Bucket: bucketName,
      Key: pdfKey,
    };

    const command = new GetObjectCommand(getParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return signedUrl;
  } catch (error) {
    throw error;
  }
};

/**
 * Get public URL for PDF (no expiration)
 * @param {string} pdfKey - Full S3 key (e.g., 'pdfs/jobOrder-123-1234567890.pdf')
 * @returns {string} - Public URL
 */
export const getPDFPublicUrl = (pdfKey) => {
  const bucketName = getBucketName();
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`;
};

/**
 * Download PDF from S3 by URL or key
 * @param {string} pdfUrlOrKey - S3 URL or key (e.g., 'pdfs/salesOrder-123.pdf')
 * @returns {Promise<Buffer>} - PDF file buffer
 */
export const downloadPDFFromS3 = async (pdfUrlOrKey) => {
  try {
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    // Extract key from URL if it's a full URL
    let key = pdfUrlOrKey;
    if (
      pdfUrlOrKey.startsWith("http://") ||
      pdfUrlOrKey.startsWith("https://")
    ) {
      try {
        const url = new URL(pdfUrlOrKey);
        // Remove leading slash and query parameters
        key = url.pathname.replace(/^\//, "");
      } catch (urlError) {
        // Fallback to regex parsing if URL constructor fails
        // Try to match pdfs/... pattern (works for both CloudFront and S3 URLs)
        const pdfsMatch = pdfUrlOrKey.match(/pdfs\/[^?]+/);
        if (pdfsMatch) {
          key = pdfsMatch[0];
        } else {
          // Try to extract from S3 URL format: https://bucket.s3.region.amazonaws.com/key
          const s3Match = pdfUrlOrKey.match(/\.s3\.[^/]+\/(.+?)(?:\?|$)/);
          if (s3Match) {
            key = s3Match[1];
          } else {
            throw new Error(
              `Could not extract S3 key from URL: ${pdfUrlOrKey}`
            );
          }
        }
      }
    }

    const getParams = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new GetObjectCommand(getParams);
    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return buffer;
  } catch (error) {
    console.error("Error downloading PDF from S3:", error);
    if (error.name === "NoSuchKey") {
      throw new Error(`PDF not found in S3: ${error.message}`);
    }
    throw new Error(`Failed to download PDF from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for blog cover image upload
 * @param {string} blogId - Blog ID for consistent naming
 * @param {string} fileType - MIME type of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns {Promise<Object>} - Object with presignedUrl, key, and publicUrl
 */
export const generateBlogCoverImagePresignedUrl = async (
  blogId,
  fileType,
  expiresIn = 300
) => {
  try {
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    const fileExtension = fileType.split("/")[1] || "jpg";
    const fileName = `cover-${blogId}.${fileExtension}`;
    const key = `images/blog/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
      CacheControl: "public, max-age=31536000", // 1 year cache for images
      ContentDisposition: "inline",
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    const cloudFrontUrl = process.env.CLOUDFRONT_URL;
    const timestamp = Date.now();
    const publicUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/${key}?t=${timestamp}`
      : `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}?t=${timestamp}`;

    return {
      presignedUrl,
      key,
      publicUrl,
      fileName,
    };
  } catch (error) {
    console.error(
      "Error generating presigned URL for blog cover image:",
      error
    );
    throw error;
  }
};

/**
 * Delete blog cover image from S3
 * @param {string} blogId - Blog ID to construct filename
 * @returns {Promise<boolean>} - Success status
 */
export const deleteBlogCoverImageFromS3 = async (blogId) => {
  try {
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    const extensions = ["jpg", "jpeg", "png", "gif", "webp"];

    for (const ext of extensions) {
      const fileName = `cover-${blogId}.${ext}`;
      const key = `images/blog/${fileName}`;

      try {
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        await s3Client.send(command);
        return true;
      } catch (error) {
        if (error.name !== "NoSuchKey") {
          console.error(`Error deleting blog cover image ${fileName}:`, error);
        }
      }
    }

    return true; // Consider it successful if no file exists
  } catch (error) {
    console.error("Error deleting blog cover image from S3:", error);
    return false;
  }
};
