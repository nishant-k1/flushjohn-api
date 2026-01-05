/**
 * Upload PDF to S3 - one unique file per document type and ID
 * Example: quote-123.pdf (will overwrite on regeneration)
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
 * @param {string} documentId - Document ID (unique per user/document)
 * @returns {Promise<Object>} - Object with directUrl, cdnUrl, s3Key, and fileName
 */
export declare const uploadPDFToS3: (pdfBuffer: any, documentType: any, documentId: any) => Promise<{
    fileName: string;
    s3Key: string;
    cdnUrl: string;
}>;
/**
 * Delete PDF from S3 by full key/filename
 * @param {string} pdfKey - Full S3 key (e.g., 'pdfs/jobOrder-123-1234567890.pdf')
 * @returns {Promise<boolean>} - Success status
 */
export declare const deletePDFFromS3: (pdfKey: any) => Promise<boolean>;
/**
 * Get signed URL for PDF access
 * @param {string} pdfKey - Full S3 key (e.g., 'pdfs/jobOrder-123-1234567890.pdf')
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
export declare const getPDFSignedUrl: (pdfKey: any, expiresIn?: number) => Promise<string>;
/**
 * Get public URL for PDF (no expiration)
 * @param {string} pdfKey - Full S3 key (e.g., 'pdfs/jobOrder-123-1234567890.pdf')
 * @returns {string} - Public URL
 */
export declare const getPDFPublicUrl: (pdfKey: any) => string;
/**
 * Download PDF from S3 by URL or key
 * @param {string} pdfUrlOrKey - S3 URL or key (e.g., 'pdfs/salesOrder-123.pdf')
 * @returns {Promise<Buffer>} - PDF file buffer
 */
export declare const downloadPDFFromS3: (pdfUrlOrKey: any) => Promise<Buffer<ArrayBuffer>>;
/**
 * Generate presigned URL for blog cover image upload
 * @param {string} blogId - Blog ID for consistent naming
 * @param {string} fileType - MIME type of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
 * @returns {Promise<Object>} - Object with presignedUrl, key, and publicUrl
 */
export declare const generateBlogCoverImagePresignedUrl: (blogId: any, fileType: any, expiresIn?: number) => Promise<{
    presignedUrl: string;
    key: string;
    publicUrl: string;
    fileName: string;
}>;
/**
 * Delete blog cover image from S3
 * @param {string} blogId - Blog ID to construct filename
 * @returns {Promise<boolean>} - Success status
 */
export declare const deleteBlogCoverImageFromS3: (blogId: any) => Promise<boolean>;
//# sourceMappingURL=s3Service.d.ts.map