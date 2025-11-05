import { Router } from "express";
import {
  authenticateToken,
  authorizeRoles,
  checkDocumentAccess,
} from "../features/auth/middleware/auth.js";
import { getCurrentDateTime } from "../lib/dayjs/index.js";
import { getPDFSignedUrl } from "../features/common/services/s3Service.js";

const router = Router();

router.get(
  "/:documentType/:documentId",
  authenticateToken,
  checkDocumentAccess,
  async (req, res) => {
    try {
      const { documentType, documentId } = req.params;

      const validTypes = ["quote", "salesOrder", "jobOrder"];
      if (!validTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document type",
          error: "INVALID_DOCUMENT_TYPE",
        });
      }

      if (!documentId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document ID format",
          error: "INVALID_DOCUMENT_ID",
        });
      }

      // Generate S3 key for PDF
      const fileName = `${documentType}-${documentId}.pdf`;
      const pdfKey = `pdfs/${fileName}`;

      try {
        // Generate signed URL for S3 access (valid for 1 hour)
        const signedUrl = await getPDFSignedUrl(pdfKey, 3600);
        
        // Redirect to S3 signed URL
        res.redirect(302, signedUrl);
      } catch (error) {
        // If PDF doesn't exist in S3, return 404
        if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
        return res.status(404).json({
          success: false,
          message: "PDF not found",
          error: "PDF_NOT_FOUND",
        });
      }
        
        // For other errors, return 500
        console.error("Error generating PDF signed URL:", error);
          res.status(500).json({
            success: false,
          message: "Error accessing PDF file",
          error: "PDF_ACCESS_ERROR",
          });
        }
    } catch (error) {
      console.error("PDF access error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

router.get(
  "/generate-url/:documentType/:documentId",
  authenticateToken,
  checkDocumentAccess,
  async (req, res) => {
    try {
      const { documentType, documentId } = req.params;

      let token = null;
      const authHeader = req.headers.authorization;
      const queryToken = req.query.token;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else if (queryToken) {
        token = queryToken;
      } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      const validTypes = ["quote", "salesOrder", "jobOrder"];
      if (!validTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document type",
          error: "INVALID_DOCUMENT_TYPE",
        });
      }

      if (!documentId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document ID format",
          error: "INVALID_DOCUMENT_ID",
        });
      }

      // Generate S3 key for PDF
      const fileName = `${documentType}-${documentId}.pdf`;
      const pdfKey = `pdfs/${fileName}`;

      try {
        // Generate signed URL for S3 access (valid for 1 hour)
        const signedUrl = await getPDFSignedUrl(pdfKey, 3600);
        
        // Also provide the API endpoint URL for backward compatibility
      const secureUrl = `${req.protocol}://${req.get(
        "host"
      )}/pdf/${documentType}/${documentId}?token=${token}`;
        
      res.json({
        success: true,
        message: "Secure PDF URL generated",
        data: {
            secureUrl, // API endpoint (redirects to S3)
            s3SignedUrl: signedUrl, // Direct S3 signed URL
          expiresIn: "1 hour",
          documentType,
          documentId,
          generatedBy: req.user.userId,
          generatedAt: getCurrentDateTime().toISOString(),
        },
      });
      } catch (error) {
        // If PDF doesn't exist in S3, return 404
        if (error.name === "NoSuchKey" || error.Code === "NoSuchKey") {
          return res.status(404).json({
            success: false,
            message: "PDF not found. Please generate the PDF first.",
            error: "PDF_NOT_FOUND",
          });
        }
        
        throw error;
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

export default router;
