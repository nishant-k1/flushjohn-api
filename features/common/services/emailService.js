import { createTransport } from "nodemailer";
import { flushjohn, quengenesis } from "../../../constants/index.js";

import quoteEmailTemplate from "../../quotes/templates/email/index.js";
import salesOrderEmailTemplate from "../../salesOrders/templates/email/index.js";
import jobOrderEmailTemplate from "../../jobOrders/templates/email/index.js";

/**
 * Send email with PDF attachment from S3
 * @param {Object} documentData - Document data
 * @param {string} documentType - 'quote', 'salesOrder', or 'jobOrder'
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

    const smtpConfigs = [
      {
        host: "smtp.zoho.in",
        port: 465,
        secure: true,
        auth: emailConfig,
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000, // Reduced for faster failure
        greetingTimeout: 8000, // Reduced for faster failure
        socketTimeout: 8000, // Reduced for faster failure
        pool: false, // Disable connection pooling
        maxConnections: 1, // Single connection
        maxMessages: 1, // Single message per connection
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
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
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
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
      },
    ];

    let transporter;
    let lastError;

    for (let i = 0; i < smtpConfigs.length; i++) {
      const config = smtpConfigs[i];

      try {
        transporter = createTransport(config);
        await transporter.verify();
        break;
      } catch (error) {
        lastError = error;
        if (i === smtpConfigs.length - 1) {
          throw new Error(
            `All SMTP configurations failed. Last error: ${lastError.message}`
          );
        }
      }
    }

    const emailContent = emailTemplate(documentData);
    const fileName = `${documentType}.pdf`; // Fixed filename - always replaces previous

    const emailOptions = {
      from: `${companyName}<${emailConfig.user}>`,
      to: documentData.email,
      subject: subject,
      text: emailContent,
      attachments: [
        {
          filename: fileName,
          path: s3PdfUrl, // S3 URL as attachment
        },
      ],
    };

    if (documentData.ccEmail) {
      emailOptions.cc = documentData.ccEmail;
    }

    const info = await transporter.sendMail(emailOptions);
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
 * @returns {Promise<boolean>} - Success status
 */
export const sendSalesOrderEmail = async (
  salesOrderData,
  salesOrderId,
  s3PdfUrl
) => {
  return sendEmailWithS3PDF(
    salesOrderData,
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
  console.log("sendJobOrderEmail called with:", {
    jobOrderData: {
      _id: jobOrderData._id,
      jobOrderNo: jobOrderData.jobOrderNo,
      vendorName: jobOrderData.vendorName,
      email: jobOrderData.email,
      ccEmail: jobOrderData.ccEmail,
      vendor: jobOrderData.vendor,
    },
    jobOrderId,
    s3PdfUrl,
  });
  return sendEmailWithS3PDF(jobOrderData, "jobOrder", jobOrderId, s3PdfUrl);
};
