import { uploadPDFToS3 } from "../../common/services/s3Service.js";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

// Import templates from feature folders
import quoteTemplate from "../../quotes/templates/pdf/index.js";
import salesOrderTemplate from "../../salesOrders/templates/pdf/index.js";
import jobOrderTemplate from "../../jobOrders/templates/pdf/index.js";

// Try to import Playwright, fallback to Puppeteer if not available
let browserLib = null;
let usePuppeteer = false;

try {
  const playwright = await import("playwright");
  browserLib = playwright.chromium;
} catch (playwrightError) {
  try {
    browserLib = await import("puppeteer");
    usePuppeteer = true;
  } catch (puppeteerError) {
    throw new Error("No PDF generation library available");
  }
}

/**
 * Generate PDF using Playwright and upload to S3
 * @param {Object} documentData - Document data from request body
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
 * @param {string} documentId - Document ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export const generatePDF = async (documentData, documentType, documentId) => {
  try {
    // Select appropriate template
    let htmlContent;
    switch (documentType) {
      case "quote":
        htmlContent = quoteTemplate(documentData);
        break;
      case "salesOrder":
        htmlContent = salesOrderTemplate(documentData);
        break;
      case "jobOrder":
        htmlContent = jobOrderTemplate(documentData);
        break;
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }

    if (!htmlContent) {
      throw new Error(`Failed to generate HTML template for ${documentType}`);
    }

    // Generate PDF using Playwright or Puppeteer
    let browser, page, pdfBuffer;

    if (usePuppeteer) {
      // Puppeteer implementation
      browser = await browserLib.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      });

      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
      });
    } else {
      // Playwright implementation
      browser = await browserLib.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const context = await browser.newContext();
      page = await context.newPage();

      await page.setContent(htmlContent, { waitUntil: "networkidle" });

      pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.5in",
          right: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
        },
      });
    }

    await browser.close();

    // Check if S3 is enabled via environment variable
    const useS3 = process.env.USE_S3_STORAGE === "true";

    // Try to upload to S3, fall back to local storage if disabled or if AWS credentials not available
    if (useS3) {
      try {
        const s3Result = await uploadPDFToS3(
          pdfBuffer,
          documentType,
          documentId
        );

        return {
          pdfUrl: s3Result.cdnUrl, // CloudFront CDN URL (or S3 direct)
        };
      } catch (s3Error) {}
    } else {
    }

    // Fall back to local storage
    // Use same naming pattern as S3 (overwrites on regeneration)
    const fileName = `${documentType}-${documentId}.pdf`;
    const finalPath = path.join(process.cwd(), "public", "temp", fileName);
    const timestamp = Date.now();

    // Ensure temp directory exists
    const tempDir = path.dirname(finalPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Use atomic file write pattern to prevent corruption
    // 1. Write to temporary file first
    const tempFileName = `${fileName}.tmp`;
    const tempPath = path.join(tempDir, tempFileName);

    try {
      // Write to temp file
      fs.writeFileSync(tempPath, pdfBuffer);

      // 2. Atomically rename temp file to final file
      // This ensures users never access a partially written file
      fs.renameSync(tempPath, finalPath);

      // PDF generated and saved locally
    } catch (writeError) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw new Error(`Failed to write PDF file: ${writeError.message}`);
    }

    // Return local URL with cache-busting query parameter
    // Use environment-specific base URL
    const baseUrl =
      process.env.API_BASE_URL ||
      process.env.BASE_URL ||
      "http://localhost:8080";
    const pdfUrl = `${baseUrl}/temp/${fileName}?t=${timestamp}`;

    // Return single URL
    return {
      pdfUrl, // Single URL for all use cases
    };
  } catch (error) {
    // PDF generation error
    throw error;
  }
};

/**
 * Generate PDF for Quote
 * @param {Object} quoteData - Quote data from request body
 * @param {string} quoteId - Quote ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export const generateQuotePDF = async (quoteData, quoteId) => {
  return generatePDF(quoteData, "quote", quoteId);
};

/**
 * Generate PDF for Sales Order
 * @param {Object} salesOrderData - Sales Order data from request body
 * @param {string} salesOrderId - Sales Order ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export const generateSalesOrderPDF = async (salesOrderData, salesOrderId) => {
  return generatePDF(salesOrderData, "salesOrder", salesOrderId);
};

/**
 * Generate PDF for Job Order
 * @param {Object} jobOrderData - Job Order data from request body
 * @param {string} jobOrderId - Job Order ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export const generateJobOrderPDF = async (jobOrderData, jobOrderId) => {
  // For job orders, we need to fetch vendor details
  if (jobOrderData.vendor && jobOrderData.vendor._id) {
    try {
      // Fetching vendor details
      const { default: Vendors } = await import(
        "../../vendors/models/Vendors/index.js"
      );

      // Try to find vendor by ID (MongoDB will handle string to ObjectId conversion)
      let vendor = await Vendors.findById(jobOrderData.vendor._id);

      // If not found, try searching by name as fallback
      if (!vendor && jobOrderData.vendor.name) {
        vendor = await Vendors.findOne({ name: jobOrderData.vendor.name });
      }

      if (vendor) {
        // Vendor found, updating data
        jobOrderData.vendor = {
          ...jobOrderData.vendor,
          ...vendor.toObject(),
        };
      } else {
        // Vendor not found
      }
    } catch (error) {
      // Error fetching vendor details
    }
  } else {
    // No vendor ID provided
  }

  return generatePDF(jobOrderData, "jobOrder", jobOrderId);
};

/**
 * Clean up old local PDF files
 * @param {number} maxAgeInDays - Delete files older than this many days (default: 1)
 * @returns {Promise<Object>} - Cleanup stats
 */
export const cleanupOldPDFs = async (maxAgeInDays = 1) => {
  try {
    const tempDir = path.join(process.cwd(), "public", "temp");

    // Check if temp directory exists
    if (!fs.existsSync(tempDir)) {
      return { deleted: 0, message: "Temp directory does not exist" };
    }

    const files = await readdir(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    let deletedCount = 0;
    const deletedFiles = [];

    for (const file of files) {
      // Only process PDF files
      if (!file.endsWith(".pdf")) continue;

      const filePath = path.join(tempDir, file);
      const stats = await stat(filePath);
      const fileAge = now - stats.mtimeMs; // Time since last modification

      // Delete if older than maxAge
      if (fileAge > maxAgeMs) {
        await unlink(filePath);
        deletedCount++;
        deletedFiles.push({
          name: file,
          ageInDays: Math.floor(fileAge / (24 * 60 * 60 * 1000)),
          size: stats.size,
        });

        // Old PDF file deleted
      }
    }

    return {
      deleted: deletedCount,
      files: deletedFiles,
      message: `Deleted ${deletedCount} PDF(s) older than ${maxAgeInDays} days`,
    };
  } catch (error) {
    // PDF cleanup error
    throw error;
  }
};
