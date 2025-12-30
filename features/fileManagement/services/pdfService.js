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

// ============================================
// BROWSER POOL FOR FASTER PDF GENERATION
// ============================================
// Reuses browser instance instead of launching new one each time
// Each PDF still gets fresh context/page with fresh data

let browserPool = null;
let browserPoolPromise = null;
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000; // Close browser after 5 min of inactivity
let browserIdleTimer = null;

/**
 * Get or create a pooled browser instance
 * @returns {Promise<Browser>} Browser instance
 */
const getPooledBrowser = async () => {
  // Reset idle timer on each use
  if (browserIdleTimer) {
    clearTimeout(browserIdleTimer);
    browserIdleTimer = null;
  }

  // Return existing browser if connected
  if (browserPool) {
    try {
      // Check if browser is still connected
      if (usePuppeteer) {
        if (browserPool.isConnected()) {
          scheduleBrowserClose();
          return browserPool;
        }
      } else {
        // Playwright - check if browser is connected
        if (browserPool.isConnected()) {
          scheduleBrowserClose();
          return browserPool;
        }
      }
    } catch (e) {
      // Browser disconnected, will create new one
      browserPool = null;
    }
  }

  // Prevent multiple simultaneous launches
  if (browserPoolPromise) {
    return browserPoolPromise;
  }

  // Launch new browser
  browserPoolPromise = (async () => {
    try {
      const launchOptions = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      };

      // Puppeteer needs single-process arg
      if (usePuppeteer) {
        launchOptions.args.push("--single-process");
      }

      browserPool = await browserLib.launch(launchOptions);
      scheduleBrowserClose();
      return browserPool;
    } finally {
      browserPoolPromise = null;
    }
  })();

  return browserPoolPromise;
};

/**
 * Schedule browser close after idle timeout
 */
const scheduleBrowserClose = () => {
  if (browserIdleTimer) {
    clearTimeout(browserIdleTimer);
  }
  browserIdleTimer = setTimeout(async () => {
    if (browserPool) {
      try {
        await browserPool.close();
      } catch (e) {
        // Ignore close errors
      }
      browserPool = null;
    }
  }, BROWSER_IDLE_TIMEOUT);
};

/**
 * Graceful shutdown - close browser pool
 */
export const closeBrowserPool = async () => {
  if (browserIdleTimer) {
    clearTimeout(browserIdleTimer);
    browserIdleTimer = null;
  }
  if (browserPool) {
    try {
      await browserPool.close();
    } catch (e) {
      // Ignore close errors
    }
    browserPool = null;
  }
};

/**
 * Generate PDF using Playwright/Puppeteer with browser pooling and upload to S3
 *
 * OPTIMIZATION: Uses browser pool to reuse browser instance across PDF generations
 * - Browser launch takes 2-4 seconds, reusing saves this time
 * - Each PDF gets a fresh context/page with fresh data (no stale content)
 * - Browser auto-closes after 5 minutes of inactivity
 *
 * @param {Object} documentData - Document data from request body
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
 * @param {string} documentId - Document ID
 * @returns {Promise<string>} - S3 URL of generated PDF
 */
export const generatePDF = async (documentData, documentType, documentId) => {
  let context = null;
  let page = null;

  try {
    // Generate fresh HTML content from current data
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

    // Get pooled browser (reuses existing or launches new)
    const browser = await getPooledBrowser();
    let pdfBuffer;

    if (usePuppeteer) {
      // Puppeteer: use incognito context for isolation
      try {
        context = await browser.createBrowserContext();
        page = await context.newPage();
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
        // Close page and context, but NOT the browser (it's pooled)
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            // Ignore - page may already be closed
          }
        }
        if (context) {
          try {
            await context.close();
          } catch (closeError) {
            // Ignore - context may already be closed
          }
        }
      }
    } else {
      // Playwright: use context for isolation
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
        // Close page and context, but NOT the browser (it's pooled)
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            // Ignore - page may already be closed
          }
        }
        if (context) {
          try {
            await context.close();
          } catch (closeError) {
            // Ignore - context may already be closed
          }
        }
      }
    }

    // Upload fresh PDF to S3
    const s3Result = await uploadPDFToS3(pdfBuffer, documentType, documentId);

    return {
      pdfUrl: s3Result.cdnUrl, // CloudFront CDN URL (or S3 direct)
    };
  } catch (error) {
    // Clean up context/page on error (browser stays in pool)
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        // Ignore
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (closeError) {
        // Ignore
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
    } catch (error) {}
  } else {
  }

  return generatePDF(jobOrderData, "jobOrder", jobOrderId);
};
