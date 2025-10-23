import { uploadPDFToS3 } from "../../common/services/s3Service.js";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

import quoteTemplate from "../../quotes/templates/pdf/index.js";
import salesOrderTemplate from "../../salesOrders/templates/pdf/index.js";
import jobOrderTemplate from "../../jobOrders/templates/pdf/index.js";

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

    let browser, page, pdfBuffer;

    if (usePuppeteer) {
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

    const useS3 = process.env.USE_S3_STORAGE === "true";

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

    const fileName = `${documentType}-${documentId}.pdf`;
    const finalPath = path.join(process.cwd(), "public", "temp", fileName);
    const timestamp = Date.now();

    const tempDir = path.dirname(finalPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `${fileName}.tmp`;
    const tempPath = path.join(tempDir, tempFileName);

    try {
      fs.writeFileSync(tempPath, pdfBuffer);

      fs.renameSync(tempPath, finalPath);

    } catch (writeError) {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw new Error(`Failed to write PDF file: ${writeError.message}`);
    }

    const baseUrl =
      process.env.API_BASE_URL ||
      process.env.BASE_URL ||
      "http://localhost:8080";
    const pdfUrl = `${baseUrl}/temp/${fileName}?t=${timestamp}`;

    return {
      pdfUrl, // Single URL for all use cases
    };
  } catch (error) {
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
  if (jobOrderData.vendor && jobOrderData.vendor._id) {
    try {
      const { default: Vendors } = await import(
        "../../vendors/models/Vendors/index.js"
      );

      let vendor = await Vendors.findById(jobOrderData.vendor._id);

      if (!vendor && jobOrderData.vendor.name) {
        vendor = await Vendors.findOne({ name: jobOrderData.vendor.name });
      }

      if (vendor) {
        jobOrderData.vendor = {
          ...jobOrderData.vendor,
          ...vendor.toObject(),
        };
      } else {
      }
    } catch (error) {
    }
  } else {
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

    if (!fs.existsSync(tempDir)) {
      return { deleted: 0, message: "Temp directory does not exist" };
    }

    const files = await readdir(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    let deletedCount = 0;
    const deletedFiles = [];

    for (const file of files) {
      if (!file.endsWith(".pdf")) continue;

      const filePath = path.join(tempDir, file);
      const stats = await stat(filePath);
      const fileAge = now - stats.mtimeMs; // Time since last modification

      if (fileAge > maxAgeMs) {
        await unlink(filePath);
        deletedCount++;
        deletedFiles.push({
          name: file,
          ageInDays: Math.floor(fileAge / (24 * 60 * 60 * 1000)),
          size: stats.size,
        });

      }
    }

    return {
      deleted: deletedCount,
      files: deletedFiles,
      message: `Deleted ${deletedCount} PDF(s) older than ${maxAgeInDays} days`,
    };
  } catch (error) {
    throw error;
  }
};
