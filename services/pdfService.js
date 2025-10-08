import { uploadPDFToS3 } from "./s3Service.js";
import fs from "fs";
import path from "path";

// Import templates
import quoteTemplate from "../templates/quotes/pdf/index.js";
import salesOrderTemplate from "../templates/salesOrders/pdf/index.js";
import jobOrderTemplate from "../templates/jobOrders/pdf/index.js";

// Try to import Playwright, fallback to Puppeteer if not available
let browserLib = null;
let usePuppeteer = false;

try {
  const playwright = await import("playwright");
  browserLib = playwright.chromium;
  console.log("✅ Using Playwright for PDF generation");
} catch (playwrightError) {
  console.warn("⚠️ Playwright not available, falling back to Puppeteer");
  try {
    browserLib = await import("puppeteer");
    usePuppeteer = true;
    console.log("✅ Using Puppeteer for PDF generation");
  } catch (puppeteerError) {
    console.error("❌ Neither Playwright nor Puppeteer available!");
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
    console.log(`🔄 Generating ${documentType} PDF for ID: ${documentId}`);

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
        const s3Url = await uploadPDFToS3(pdfBuffer, documentType, documentId);
        console.log(`✅ PDF generated and uploaded to S3: ${s3Url}`);
        return s3Url;
      } catch (s3Error) {
        console.warn("⚠️ S3 upload failed, saving locally:", s3Error.message);
      }
    } else {
      console.log("ℹ️ S3 storage disabled, using local storage");
    }

    // Fall back to local storage with unique filename
    // Use timestamp and documentId to prevent race conditions
    const timestamp = Date.now();
    const fileName = `${documentType}-${documentId}-${timestamp}.pdf`;
    const finalPath = path.join(process.cwd(), "public", "temp", fileName);

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

      console.log(
        `✅ PDF generated and saved locally (atomic write): ${fileName}`
      );
    } catch (writeError) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw new Error(`Failed to write PDF file: ${writeError.message}`);
    }

    // Return local URL with cache-busting query parameter
    // Use environment-specific base URL
    const baseUrl = process.env.API_BASE_URL || process.env.BASE_URL || 'http://localhost:8080';
    const localUrl = `${baseUrl}/temp/${fileName}?t=${timestamp}`;
    console.log(`✅ PDF URL: ${localUrl}`);
    return localUrl;
  } catch (error) {
    console.error(`❌ Error generating ${documentType} PDF:`, error);
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
      const { default: Vendors } = await import("../models/Vendors/index.js");
      const vendor = await Vendors.findById(jobOrderData.vendor._id);
      if (vendor) {
        jobOrderData.vendor = {
          ...jobOrderData.vendor,
          ...vendor.toObject(),
        };
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch vendor details:", error.message);
    }
  }

  return generatePDF(jobOrderData, "jobOrder", jobOrderId);
};
