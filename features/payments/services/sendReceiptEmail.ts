/**
 * Send Sales Receipt Email
 * Sends receipt email after successful payment
 * Includes both HTML email body and PDF attachment
 */

import { getPooledTransporter } from "../../common/services/emailService.js";
import receiptEmailTemplate from "../templates/email.js";
import * as salesOrdersRepository from "../../salesOrders/repositories/salesOrdersRepository.js";
import { generateReceiptPDFBuffer } from "../../fileManagement/services/pdfService.js";

/**
 * Send sales receipt email after successful payment
 * @param {Object} payment - Payment document
 * @param {Object} salesOrder - Sales Order document (optional, will fetch if not provided)
 * @returns {Promise<boolean>} - Success status
 */
export const sendSalesReceiptEmail = async (payment, salesOrder = null) => {
  try {
    // Fetch sales order if not provided
    if (!salesOrder && payment.salesOrder) {
      salesOrder = await salesOrdersRepository.findById(payment.salesOrder);
    }

    if (!salesOrder) {
      console.error("Sales order not found for receipt email");
      return false;
    }

    // Get customer email from lead
    const customerEmail = salesOrder.lead?.email;
    if (!customerEmail) {
      console.error("Customer email not found for receipt email");
      return false;
    }

    // Prepare receipt data with flattened customer information
    const salesOrderObj = salesOrder.toObject
      ? salesOrder.toObject()
      : salesOrder;
    const lead = salesOrderObj.lead || {};

    const receiptData = {
      // Payment information
      amount: payment.amount,
      createdAt: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      cardLast4: payment.cardLast4,
      cardBrand: payment.cardBrand,

      // Customer information (flattened from lead)
      fName: lead.fName || salesOrderObj.fName || "",
      lName: lead.lName || salesOrderObj.lName || "",
      cName: lead.cName || salesOrderObj.cName || "",
      email: lead.email || salesOrderObj.email || "",
      phone: lead.phone || salesOrderObj.phone || "",
      streetAddress: lead.streetAddress || salesOrderObj.streetAddress || "",
      city: lead.city || salesOrderObj.city || "",
      state: lead.state || salesOrderObj.state || "",
      zip: lead.zip || salesOrderObj.zip || "",

      // Sales order information
      salesOrderNo: salesOrderObj.salesOrderNo || "",
      salesOrderCreatedAt: salesOrderObj.createdAt || "",

      // Products (for itemized receipt)
      products: salesOrderObj.products || [],

      // Keep full salesOrder for email template compatibility
      salesOrder: salesOrderObj,
    };

    // Get email configuration
    const emailConfig = {
      user: process.env.FLUSH_JOHN_EMAIL_ID,
      pass: process.env.FLUSH_JOHN_EMAIL_PASSWORD,
    };

    // Get pooled transporter
    const transporter = await getPooledTransporter(emailConfig);

    // Generate email content (email template still uses salesOrder structure)
    const emailData = {
      salesOrder: salesOrderObj,
      amount: payment.amount,
      createdAt: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      cardLast4: payment.cardLast4,
    };
    const emailContent = receiptEmailTemplate(emailData);
    const companyName = process.env.FLUSH_JOHN_COMPANY_NAME || "Flush John";
    const subject = `${companyName}: Payment Receipt - Sales Order #${salesOrder.salesOrderNo}`;

    // Generate PDF receipt (uses flattened receiptData)
    let pdfBuffer;
    try {
      pdfBuffer = await generateReceiptPDFBuffer(receiptData);
    } catch (pdfError) {
      console.error(
        "Failed to generate receipt PDF, sending email without attachment:",
        pdfError
      );
      // Continue without PDF attachment if generation fails
    }

    // Prepare email options
    const emailOptions: any = {
      from: `${companyName} <${emailConfig.user}>`,
      to: customerEmail,
      subject: subject,
      html: emailContent,
    };

    // Attach PDF if generated successfully
    if (pdfBuffer) {
      emailOptions.attachments = [
        {
          filename: `Payment_Receipt_${
            salesOrder.salesOrderNo || payment._id
          }.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
    }

    // Send email
    await transporter.sendMail(emailOptions);

    return true;
  } catch (error) {
    console.error("Error sending sales receipt email:", error);
    return false;
  }
};
