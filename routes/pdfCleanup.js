import { Router } from "express";
import { cleanupOldPDFs } from "../features/file-management/services/pdfService.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../features/auth/middleware/auth.js";
import { getCurrentDateTime } from "../lib/dayjs/index.js";

const router = Router();

/**
 * GET /pdf-cleanup - Manually trigger PDF cleanup
 * Only admins can trigger cleanup
 */
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const maxAgeInDays = parseInt(req.query.days) || 1;

      // Validate maxAge
      if (maxAgeInDays < 1 || maxAgeInDays > 365) {
        return res.status(400).json({
          success: false,
          message: "Invalid age parameter. Must be between 1 and 365 days",
          error: "INVALID_AGE_PARAMETER",
        });
      }

      const result = await cleanupOldPDFs(maxAgeInDays);

      res.json({
        success: true,
        message: result.message,
        data: {
          deletedCount: result.deleted,
          deletedFiles: result.files,
          maxAgeInDays,
          timestamp: getCurrentDateTime().toISOString(),
        },
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: "Failed to cleanup PDFs",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

/**
 * GET /pdf-cleanup/stats - Get cleanup statistics without deleting
 */
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { promisify } = await import("util");

      const readdir = promisify(fs.readdir);
      const stat = promisify(fs.stat);

      const tempDir = path.join(process.cwd(), "public", "temp");

      if (!fs.existsSync(tempDir)) {
        return res.json({
          success: true,
          data: {
            totalFiles: 0,
            totalSize: 0,
            files: [],
          },
        });
      }

      const files = await readdir(tempDir);
      const now = Date.now();

      const fileStats = [];
      let totalSize = 0;

      for (const file of files) {
        if (!file.endsWith(".pdf")) continue;

        const filePath = path.join(tempDir, file);
        const stats = await stat(filePath);
        const ageInDays = Math.floor(
          (now - stats.mtimeMs) / (24 * 60 * 60 * 1000)
        );

        totalSize += stats.size;
        fileStats.push({
          name: file,
          ageInDays,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        });
      }

      res.json({
        success: true,
        data: {
          totalFiles: fileStats.length,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          files: fileStats.sort((a, b) => b.ageInDays - a.ageInDays), // Oldest first
        },
      });
    } catch (error) {

      res.status(500).json({
        success: false,
        message: "Failed to get PDF statistics",
        error: "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }
);

export default router;
