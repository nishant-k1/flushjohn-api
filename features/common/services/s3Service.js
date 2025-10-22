import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 Client lazily
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
    // Use consistent filename per document (overwrites on regeneration to avoid duplicates)
    // Pattern: {type}-{id}.pdf (e.g., quote-123.pdf, salesOrder-456.pdf)
    const fileName = `${documentType}-${documentId}.pdf`;
    const key = `pdfs/${fileName}`;
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    // Upload PDF - will overwrite if exists
    // Note: ACL removed - rely on bucket policy for public access
    // Many modern S3 buckets have ACLs disabled
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ContentDisposition: "inline",
      // Set cache headers to prevent CloudFront from caching PDFs
      CacheControl: "no-store, no-cache, must-revalidate, max-age=0",
      Expires: new Date(0), // Expire immediately
    };

    const command = new PutObjectCommand(uploadParams);

    try {
      await s3Client.send(command);
    } catch (uploadError) {
      // S3 upload error
      throw uploadError;
    }

    // Build URLs
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;

    // Use timestamp for cache busting
    const timestamp = Date.now();

    // For S3 files, we use CloudFront CDN URL (preferred) or direct S3 URL (fallback)
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
    // S3 service error
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

    // PDF deleted successfully
    return true;
  } catch (error) {
    // Don't throw error if file doesn't exist
    // PDF deletion failed
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
 * Generate presigned URL for blog cover image upload
 * @param {string} blogId - Blog ID for consistent naming
 * @param {string} fileType - MIME type of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns {Promise<Object>} - Object with presignedUrl, key, and publicUrl
 */
export const generateBlogCoverImagePresignedUrl = async (blogId, fileType, expiresIn = 300) => {
  try {
    const bucketName = getBucketName();
    const s3Client = getS3Client();
    
    // Generate consistent filename: cover-{blogId}.{extension}
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
    
    // Generate public URL for after upload
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
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
    console.error("Error generating presigned URL for blog cover image:", error);
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
    
    // Try common image extensions
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
        console.log(`Blog cover image deleted from S3: ${fileName}`);
        return true;
      } catch (error) {
        // Continue to next extension if file not found
        if (error.name !== "NoSuchKey") {
          console.error(`Error deleting blog cover image ${fileName}:`, error);
        }
      }
    }
    
    console.log(`No blog cover image found for blog ${blogId}`);
    return true; // Consider it successful if no file exists
  } catch (error) {
    console.error("Error deleting blog cover image from S3:", error);
    return false;
  }
};
