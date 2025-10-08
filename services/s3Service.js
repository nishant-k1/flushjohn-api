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
 * Upload PDF to S3 with unique filename per document
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
 * @param {string} documentId - Document ID
 * @returns {Promise<string>} - S3 URL of uploaded PDF
 */
export const uploadPDFToS3 = async (pdfBuffer, documentType, documentId) => {
  try {
    // Use documentId in filename to prevent race conditions between users
    const timestamp = Date.now();
    const fileName = `${documentType}-${documentId}-${timestamp}.pdf`;
    const key = `pdfs/${fileName}`;
    const bucketName = getBucketName();
    const s3Client = getS3Client();

    // Upload new PDF (old PDFs will be cleaned up separately if needed)
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
    await s3Client.send(command);

    // Build URLs
    const cloudFrontUrl = process.env.CLOUDFRONT_URL || process.env.CDN_URL;
    const directS3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Return both direct S3 URL and CloudFront CDN URL
    const result = {
      fileName: fileName,
      s3Key: key,
      directUrl: directS3Url,
      cdnUrl: cloudFrontUrl
        ? `${cloudFrontUrl}/${key}?t=${timestamp}`
        : directS3Url,
    };

    console.log(`✅ PDF uploaded to S3: ${bucketName}/${key}`);
    if (cloudFrontUrl) {
      console.log(`✅ CDN URL: ${result.cdnUrl}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error uploading PDF to S3:", error);
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

    console.log(`✅ PDF deleted from S3: ${pdfKey}`);
    return true;
  } catch (error) {
    // Don't throw error if file doesn't exist
    console.log(`ℹ️ PDF not found in S3 (this is OK): ${pdfKey}`);
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
    console.error("❌ Error generating signed URL:", error);
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
