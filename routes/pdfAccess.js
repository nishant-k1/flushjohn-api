import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  authenticateToken,
  authorizeRoles,
  checkDocumentAccess,
} from "../features/auth/middleware/auth.js";
import { getCurrentDateTime } from "../lib/dayjs/index.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /pdf/:documentType/:documentId - Secure PDF access
router.get(
  "/:documentType/:documentId",
  authenticateToken,
  checkDocumentAccess,
  async (req, res) => {
    try {
      const { documentType, documentId } = req.params;

      // Validate document type
      const validTypes = ["quote", "salesOrder", "jobOrder"];
      if (!validTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document type",
          error: "INVALID_DOCUMENT_TYPE",
        });
      }

      // Validate document ID format (MongoDB ObjectId)
      if (!documentId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document ID format",
          error: "INVALID_DOCUMENT_ID",
        });
      }

      // Construct file path - using fixed filename that always replaces previous
      const fileName = `${documentType}.pdf`;
      const filePath = path.join(__dirname, "../public/temp", fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "PDF not found",
          error: "PDF_NOT_FOUND",
        });
      }

      // Log PDF access for security auditing

      // Set appropriate headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour
      res.setHeader("X-Content-Type-Options", "nosniff"); // Security header
      res.setHeader("X-Frame-Options", "DENY"); // Prevent clickjacking

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on("error", (error) => {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error reading PDF file",
            error: "FILE_READ_ERROR",
          });
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
);

// GET /pdf/generate-url/:documentType/:documentId - Generate secure access URL
router.get(
  "/generate-url/:documentType/:documentId",
  authenticateToken,
  checkDocumentAccess,
  async (req, res) => {
    try {
      const { documentType, documentId } = req.params;

      // Extract token from request (same logic as in auth middleware)
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

      // Validate document type
      const validTypes = ["quote", "salesOrder", "jobOrder"];
      if (!validTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document type",
          error: "INVALID_DOCUMENT_TYPE",
        });
      }

      // Validate document ID format
      if (!documentId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid document ID format",
          error: "INVALID_DOCUMENT_ID",
        });
      }

      // Generate secure URL with token
      const secureUrl = `${req.protocol}://${req.get(
        "host"
      )}/pdf/${documentType}/${documentId}?token=${token}`;

      // Log URL generation for security auditing

      res.json({
        success: true,
        message: "Secure PDF URL generated",
        data: {
          secureUrl,
          expiresIn: "1 hour",
          documentType,
          documentId,
          generatedBy: req.user.userId,
          generatedAt: getCurrentDateTime().toISOString(),
        },
      });
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
