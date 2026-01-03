import { createTransport } from "nodemailer";
import { flushjohn, quengenesis } from "../../../constants.js";

import quoteEmailTemplate from "../../quotes/templates/email.js";
import salesOrderEmailTemplate from "../../salesOrders/templates/email.js";
import invoiceEmailTemplate from "../../salesOrders/templates/invoice.js";
import jobOrderEmailTemplate from "../../jobOrders/templates/email.js";

// ============================================
// SMTP CONNECTION POOL FOR FASTER EMAIL SENDING
// ============================================
// Reuses SMTP connections instead of creating new ones each time
// Connection pool automatically manages connection lifecycle

// Cache for pooled transporters (keyed by email account)
const transporterPool = new Map();
const TRANSPORTER_IDLE_TIMEOUT = 5 * 60 * 1000; // Close after 5 min of inactivity
const transporterTimers = new Map();

/**
 * Get or create a pooled transporter for the given email config
 * @param {Object} emailConfig - Email credentials { user, pass }
 * @returns {Promise<Transporter>} Nodemailer transporter
 */
const getPooledTransporter = async (emailConfig) => {
  const cacheKey = emailConfig.user;

  // Reset idle timer on each use
  if (transporterTimers.has(cacheKey)) {
    clearTimeout(transporterTimers.get(cacheKey));
  }

  // Return existing transporter if available
  if (transporterPool.has(cacheKey)) {
    const transporter = transporterPool.get(cacheKey);
    try {
      // Quick check if connection is still valid
      await transporter.verify();
      scheduleTransporterClose(cacheKey);
      return transporter;
    } catch (e) {
      // Connection lost, remove from pool
      transporterPool.delete(cacheKey);
    }
  }

  // Create new pooled transporter
  const smtpConfigs = [
    {
      host: "smtp.zoho.in",
      port: 465,
      secure: true,
      auth: emailConfig,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      pool: true, // ENABLED: Connection pooling
      maxConnections: 3, // Allow up to 3 connections
      maxMessages: 50, // Messages per connection before recycling
    },
    {
      host: "smtp.zoho.in",
      port: 587,
      secure: false,
      auth: emailConfig,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
    },
    {
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: emailConfig,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
    },
  ];

  let transporter;
  let lastError;

  for (let i = 0; i < smtpConfigs.length; i++) {
    const config = smtpConfigs[i];

    try {
      transporter = createTransport(config);
      await transporter.verify();
      // Store in pool
      transporterPool.set(cacheKey, transporter);
      scheduleTransporterClose(cacheKey);
      return transporter;
    } catch (error) {
      lastError = error;
      if (i === smtpConfigs.length - 1) {
        throw new Error(
          `All SMTP configurations failed. Last error: ${lastError.message}`
        );
      }
    }
  }

  throw new Error("Failed to create email transporter");
};

/**
 * Schedule transporter close after idle timeout
 */
const scheduleTransporterClose = (cacheKey) => {
  if (transporterTimers.has(cacheKey)) {
    clearTimeout(transporterTimers.get(cacheKey));
  }
  const timer = setTimeout(() => {
    const transporter = transporterPool.get(cacheKey);
    if (transporter) {
      try {
        transporter.close();
      } catch (e) {
        // Ignore close errors
      }
      transporterPool.delete(cacheKey);
    }
    transporterTimers.delete(cacheKey);
  }, TRANSPORTER_IDLE_TIMEOUT);
  transporterTimers.set(cacheKey, timer);
};

/**
 * Graceful shutdown - close all transporters
 */
export const closeEmailPool = () => {
  for (const [key, transporter] of transporterPool) {
    try {
      transporter.close();
    } catch (e) {
      // Ignore close errors
    }
  }
  transporterPool.clear();
  for (const timer of transporterTimers.values()) {
    clearTimeout(timer);
  }
  transporterTimers.clear();
};

/**
 * Send email with PDF attachment from S3
 * 
 * OPTIMIZATION: Uses pooled SMTP connections for faster email sending
 * - First email takes normal time (establishes connection)
 * - Subsequent emails reuse connection (50%+ faster)
 * 
 * @param {Object} documentData - Document data
 * @param {string} documentType - 'quote', 'salesOrder', 'invoice', or 'jobOrder'
 * @param {string} documentId - Document ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmailWithS3PDF = async (
  documentData,
  documentType,
  documentId,
  s3PdfUrl
) => {
  try {
    let emailConfig, emailTemplate, subject, companyName;

    switch (documentType) {
      case "quote":
        emailConfig = {
          user: process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID,
          pass: process.env.FLUSH_JOHN_EMAIL_PASSWORD,
        };
        emailTemplate = quoteEmailTemplate;
        subject = `${flushjohn.cName}: Quote`;
        companyName = flushjohn.cName;
        break;

      case "salesOrder":
        emailConfig = {
          user: process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID,
          pass: process.env.FLUSH_JOHN_EMAIL_PASSWORD,
        };
        emailTemplate = salesOrderEmailTemplate;
        subject = `${flushjohn.cName}: Sales Order Confirmation`;
        companyName = flushjohn.cName;
        break;

      case "invoice":
        emailConfig = {
          user: process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID,
          pass: process.env.FLUSH_JOHN_EMAIL_PASSWORD,
        };
        emailTemplate = invoiceEmailTemplate;
        subject = `${flushjohn.cName}: Invoice #${documentData.salesOrderNo || "N/A"}`;
        companyName = flushjohn.cName;
        break;

      case "jobOrder":
        emailConfig = {
          user: process.env.NEXT_PUBLIC_QUENGENESIS_EMAIL_ID,
          pass: process.env.QUENGENESIS_EMAIL_PASSWORD,
        };
        emailTemplate = jobOrderEmailTemplate;
        subject = `${quengenesis.cName}: Job Order Confirmation`;
        companyName = quengenesis.cName;
        break;

      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }

    // Get pooled transporter (reuses existing connection)
    const transporter = await getPooledTransporter(emailConfig);

    const emailContent = emailTemplate(documentData);
    const fileName = `${documentType}.pdf`;

    const emailOptions = {
      from: `${companyName}<${emailConfig.user}>`,
      to: documentData.email,
      subject: subject,
      text: emailContent,
      attachments: [
        {
          filename: fileName,
          path: s3PdfUrl,
        },
      ],
    };

    if (documentData.ccEmail) {
      emailOptions.cc = documentData.ccEmail;
    }

    await transporter.sendMail(emailOptions);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });

    if (error.code === "ENOTFOUND") {
      throw new Error(`Email server not found. Check SMTP configuration.`);
    } else if (error.responseCode === 535 || error.code === "EAUTH") {
      throw new Error(`Email authentication failed. Check email credentials.`);
    } else if (
      error.message?.includes("Access Denied") ||
      error.message?.includes("403")
    ) {
      throw new Error(
        `Cannot access PDF at ${s3PdfUrl}. PDF file may not have public read permissions.`
      );
    } else {
      throw error;
    }
  }
};

/**
 * Send Quote Email
 * @param {Object} quoteData - Quote data
 * @param {string} quoteId - Quote ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @returns {Promise<boolean>} - Success status
 */
export const sendQuoteEmail = async (quoteData, quoteId, s3PdfUrl) => {
  return sendEmailWithS3PDF(quoteData, "quote", quoteId, s3PdfUrl);
};

/**
 * Send Sales Order Email
 * @param {Object} salesOrderData - Sales Order data
 * @param {string} salesOrderId - Sales Order ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @param {string} paymentLinkUrl - Optional payment link URL
 * @returns {Promise<boolean>} - Success status
 */
export const sendSalesOrderEmail = async (
  salesOrderData,
  salesOrderId,
  s3PdfUrl,
  paymentLinkUrl = null
) => {
  // Add payment link to sales order data if provided
  const emailDataWithPaymentLink = paymentLinkUrl
    ? { ...salesOrderData, paymentLinkUrl }
    : salesOrderData;
  
  return sendEmailWithS3PDF(
    emailDataWithPaymentLink,
    "salesOrder",
    salesOrderId,
    s3PdfUrl
  );
};

/**
 * Send Job Order Email
 * @param {Object} jobOrderData - Job Order data
 * @param {string} jobOrderId - Job Order ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @returns {Promise<boolean>} - Success status
 */
export const sendJobOrderEmail = async (jobOrderData, jobOrderId, s3PdfUrl) => {
  return sendEmailWithS3PDF(jobOrderData, "jobOrder", jobOrderId, s3PdfUrl);
};

/**
 * Send Invoice Email (with payment link)
 * @param {Object} invoiceData - Invoice/Sales Order data
 * @param {string} salesOrderId - Sales Order ID
 * @param {string} s3PdfUrl - S3 URL of the PDF
 * @param {string} paymentLinkUrl - Payment link URL (required for invoice)
 * @returns {Promise<boolean>} - Success status
 */
export const sendInvoiceEmail = async (
  invoiceData,
  salesOrderId,
  s3PdfUrl,
  paymentLinkUrl
) => {
  if (!paymentLinkUrl) {
    throw new Error("Payment link URL is required for invoice emails");
  }

  // Add payment link to invoice data
  const emailDataWithPaymentLink = {
    ...invoiceData,
    paymentLinkUrl,
  };
  
  return sendEmailWithS3PDF(
    emailDataWithPaymentLink,
    "invoice",
    salesOrderId,
    s3PdfUrl
  );
};
