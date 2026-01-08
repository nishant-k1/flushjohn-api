import { uploadPDFToS3 } from "../../common/services/s3Service.js";
import { minifyTemplate } from "../../../utils/htmlMinifier.js";

import quoteTemplate from "../../quotes/templates/pdf.js";
import salesOrderTemplate from "../../salesOrders/templates/pdf.js";
import jobOrderTemplate from "../../jobOrders/templates/pdf.js";
import receiptTemplate from "../../payments/templates/pdf.js";

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
      // OPTIMIZATION: Browser launch options optimized for faster PDF generation
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
          "--disable-extensions",
          "--disable-plugins",
          "--disable-web-security",
          "--disable-features=TranslateUI",
          "--disable-ipc-flooding-protection",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
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
 * Pre-warm browser pool (call on server startup for faster first PDF)
 * OPTIMIZATION: Starts browser early so first PDF generation is faster
 */
export const preWarmBrowserPool = async () => {
  try {
    console.log("🔥 Pre-warming browser pool...");
    const startTime = Date.now();
    await getPooledBrowser();
    const warmupTime = Date.now() - startTime;
    console.log(`✅ Browser pool pre-warmed in ${warmupTime}ms`);
  } catch (error) {
    console.warn("⚠️ Browser pool pre-warming failed (non-critical):", error.message);
  }
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
  const totalStartTime = Date.now();

  try {
    // Generate fresh HTML content from current data
    const templateStartTime = Date.now();
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
      case "receipt":
        htmlContent = receiptTemplate(documentData);
        break;
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }
    const templateTime = Date.now() - templateStartTime;
    
    // OPTIMIZATION: Minify HTML template (reduces size by 20-30%, faster parsing)
    // This does NOT change visual output - browsers render identically
    const minifyStartTime = Date.now();
    htmlContent = minifyTemplate(htmlContent);
    const minifyTime = Date.now() - minifyStartTime;
    
    console.log(
      `⏱️ [PDF ${documentType}-${documentId}] Template generation: ${templateTime}ms | Minification: ${minifyTime}ms`
    );

    if (!htmlContent) {
      throw new Error(`Failed to generate HTML template for ${documentType}`);
    }

    // Get pooled browser (reuses existing or launches new)
    const browserStartTime = Date.now();
    const browser = await getPooledBrowser();
    const browserTime = Date.now() - browserStartTime;
    console.log(
      `⏱️ [PDF ${documentType}-${documentId}] Browser get/launch: ${browserTime}ms`
    );
    let pdfBuffer;

    if (usePuppeteer) {
      // Puppeteer: use incognito context for isolation
      try {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        // OPTIMIZATION: Use "domcontentloaded" instead of "load" for faster rendering
        // Templates are static HTML with no external resources, so DOM ready is sufficient
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

        // OPTIMIZATION: Use optimized PDF options for faster generation
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.5in",
            right: "0.5in",
            bottom: "0.5in",
            left: "0.5in",
          },
          preferCSSPageSize: false, // Faster - use format instead
          displayHeaderFooter: false, // Disable if not needed
          // Note: DPI reduction requires post-processing with pdf-lib or similar
          // Current approach uses default ~96 DPI which is optimal for screen viewing
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
        const contextStartTime = Date.now();
        context = await browser.newContext();
        page = await context.newPage();
        const contextTime = Date.now() - contextStartTime;
        console.log(
          `⏱️ [PDF ${documentType}-${documentId}] Context/page creation: ${contextTime}ms`
        );

        const renderStartTime = Date.now();
        // OPTIMIZATION: Use "domcontentloaded" instead of "load" for faster rendering
        // Templates are static HTML with no external resources, so DOM ready is sufficient
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
        const renderTime = Date.now() - renderStartTime;
        console.log(
          `⏱️ [PDF ${documentType}-${documentId}] Page render: ${renderTime}ms`
        );

        const pdfGenStartTime = Date.now();
        // OPTIMIZATION: Use optimized PDF options for faster generation
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.5in",
            right: "0.5in",
            bottom: "0.5in",
            left: "0.5in",
          },
          preferCSSPageSize: false, // Faster - use format instead
          displayHeaderFooter: false, // Disable if not needed
          // Note: DPI reduction requires post-processing with pdf-lib or similar
          // Current approach uses default ~96 DPI which is optimal for screen viewing
        });
        const pdfGenTime = Date.now() - pdfGenStartTime;
        console.log(
          `⏱️ [PDF ${documentType}-${documentId}] PDF generation: ${pdfGenTime}ms`
        );
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

    // OPTIMIZATION: Upload to S3 in background (non-blocking)
    // Generate URL immediately without waiting for upload to complete
    const s3PrepStartTime = Date.now();
    const fileName = `${documentType}-${documentId}.pdf`;
    const key = `pdfs/${fileName}`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const cloudFrontUrl = process.env.CLOUDFRONT_URL;
    const timestamp = Date.now();
    const s3DirectUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}?t=${timestamp}`;
    const pdfUrl = cloudFrontUrl
      ? `${cloudFrontUrl}/${key}?t=${timestamp}`
      : s3DirectUrl;
    const s3PrepTime = Date.now() - s3PrepStartTime;
    console.log(
      `⏱️ [PDF ${documentType}-${documentId}] S3 URL prep: ${s3PrepTime}ms`
    );

    // Upload to S3 in background (don't await - fire and forget)
    const s3UploadStartTime = Date.now();
    uploadPDFToS3(pdfBuffer, documentType, documentId)
      .then(() => {
        const s3UploadTime = Date.now() - s3UploadStartTime;
        console.log(
          `⏱️ [PDF ${documentType}-${documentId}] S3 upload (background): ${s3UploadTime}ms`
        );
      })
      .catch((error) => {
        console.error(
          `⚠️ [PDF ${documentType}-${documentId}] Background S3 upload failed (non-critical):`,
          error.message
        );
      });

    const totalTime = Date.now() - totalStartTime;
    console.log(
      `⏱️ [PDF ${documentType}-${documentId}] Total PDF generation: ${totalTime}ms`
    );

    return {
      pdfUrl: pdfUrl, // Return immediately without waiting for upload
      pdfBuffer: pdfBuffer, // Return buffer to avoid re-downloading from S3
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

    // Enhance error with more context
    const errorMessage = error.message || String(error);
    const enhancedError = new Error(
      `PDF generation failed for ${documentType} (ID: ${documentId}): ${errorMessage}`
    );
    enhancedError.stack = error.stack;
    enhancedError.cause = error;

    console.error("❌ PDF generation error:", {
      documentType,
      documentId,
      error: errorMessage,
      stack: error.stack,
    });

    throw enhancedError;
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
      const { default: Vendors } =
        await import("../../vendors/models/Vendors.js");

      let vendor = await (Vendors as any).findById(jobOrderData.vendor._id);

      if (!vendor && jobOrderData.vendor.name) {
        vendor = await (Vendors as any).findOne({
          name: jobOrderData.vendor.name,
        });
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

/**
 * Generate PDF buffer for receipt (without uploading to S3)
 * Used for email attachments
 * @param {Object} receiptData - Receipt data { salesOrder, amount, createdAt, paymentMethod, cardLast4, cardBrand }
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generateReceiptPDFBuffer = async (receiptData) => {
  let context = null;
  let page = null;

  try {
    // Generate HTML content from receipt template
    const htmlContent = receiptTemplate(receiptData);

    if (!htmlContent) {
      throw new Error("Failed to generate HTML template for receipt");
    }

    // Get pooled browser (reuses existing or launches new)
    const browser = await getPooledBrowser();
    let pdfBuffer;

    if (usePuppeteer) {
      // Puppeteer: use incognito context for isolation
      try {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        // OPTIMIZATION: Use "domcontentloaded" instead of "load" for faster rendering
        // Templates are static HTML with no external resources, so DOM ready is sufficient
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

        // OPTIMIZATION: Use optimized PDF options for faster generation
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.5in",
            right: "0.5in",
            bottom: "0.5in",
            left: "0.5in",
          },
          preferCSSPageSize: false, // Faster - use format instead
          displayHeaderFooter: false, // Disable if not needed
          // Note: DPI reduction requires post-processing with pdf-lib or similar
          // Current approach uses default ~96 DPI which is optimal for screen viewing
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
        // OPTIMIZATION: Use "domcontentloaded" instead of "load" for faster rendering
        // Templates are static HTML with no external resources, so DOM ready is sufficient
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

        // OPTIMIZATION: Use optimized PDF options for faster generation
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "0.5in",
            right: "0.5in",
            bottom: "0.5in",
            left: "0.5in",
          },
          preferCSSPageSize: false, // Faster - use format instead
          displayHeaderFooter: false, // Disable if not needed
          // Note: DPI reduction requires post-processing with pdf-lib or similar
          // Current approach uses default ~96 DPI which is optimal for screen viewing
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

    return pdfBuffer;
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

    console.error("❌ Receipt PDF generation error:", {
      error: error.message,
      stack: error.stack,
    });

    throw error;
  }
};
