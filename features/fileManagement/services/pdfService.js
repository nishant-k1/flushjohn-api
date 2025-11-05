import { uploadPDFToS3 } from "../../common/services/s3Service.js";

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
  let browser = null;
  let context = null;
  let page = null;

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

    let pdfBuffer;

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

      try {
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
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.error("Error closing page:", closeError);
          }
        }
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error("Error closing browser:", closeError);
          }
        }
      }
    } else {
      browser = await browserLib.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      try {
        context = await browser.newContext();
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
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.error("Error closing page:", closeError);
          }
        }
        if (context) {
          try {
            await context.close();
          } catch (closeError) {
            console.error("Error closing context:", closeError);
          }
        }
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            console.error("Error closing browser:", closeError);
          }
        }
      }
    }

    // Always upload to S3 - no local file storage
    const s3Result = await uploadPDFToS3(
      pdfBuffer,
      documentType,
      documentId
    );

    return {
      pdfUrl: s3Result.cdnUrl, // CloudFront CDN URL (or S3 direct)
    };
  } catch (error) {
    // Ensure browser is closed even if error occurs
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.error("Error closing page during error handling:", closeError);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (closeError) {
        console.error("Error closing context during error handling:", closeError);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser during error handling:", closeError);
      }
    }
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

