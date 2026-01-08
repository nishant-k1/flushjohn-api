/**
 * Send Sales Receipt Email
 * Sends receipt email after successful payment
 * Includes both HTML email body and PDF attachment
 */

import { getPooledTransporter } from "../../common/services/emailService.js";
import receiptEmailTemplate from "../templates/email.js";
import * as salesOrdersRepository from "../../salesOrders/repositories/salesOrdersRepository.js";
import { generateReceiptPDFBuffer } from "../../fileManagement/services/pdfService.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";
import { safeDate, safeCurrency } from "../../../utils/safeValue.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    const flushjohn_phone = process.env.FLUSH_JOHN_PHONE;
    const flushjohn_email = process.env.FLUSH_JOHN_EMAIL_ID;
    const flushjohn_website =
      process.env.FLUSH_JOHN_HOMEPAGE || process.env.WEBSITE_URL;
    const subject = `${companyName}: Payment Receipt - Sales Order #${salesOrder.salesOrderNo}`;

    // Format payment date and method for plain text
    const paymentDate = safeDate(payment.createdAt || new Date(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const paymentMethodDisplay =
      payment.paymentMethod === "payment_link"
        ? "Payment Link"
        : payment.paymentMethod === "saved_card"
          ? `Saved Card${payment.cardLast4 ? ` (•••• ${payment.cardLast4})` : ""}`
          : `Card Payment${
              payment.cardLast4 ? ` (•••• ${payment.cardLast4})` : ""
            }`;

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

    // Generate plain text version for better email client compatibility
    const plainTextContent = `
Payment Receipt - Sales Order #${salesOrder.salesOrderNo}

Hi ${receiptData.fName || "Customer"},

Your payment of ${safeCurrency(payment.amount)} has been successfully processed.

Payment Details:
- Sales Order #: ${salesOrder.salesOrderNo}
- Payment Date: ${paymentDate}
- Payment Method: ${paymentMethodDisplay}
- Amount Paid: ${safeCurrency(payment.amount)}

${
  salesOrder?.products?.length > 0
    ? `
Order Items:
${salesOrder.products
  .map((p: any) => {
    const quantity = p.quantity || 0;
    const rate = p.rate || 0;
    const total = calculateProductAmount(quantity, rate);
    return `- ${p.item || "N/A"} (Quantity: ${quantity}) - $${total}`;
  })
  .join("\n")}
 `
    : ""
}

Your payment has been successfully processed and your order is being prepared. If you have any questions about this payment or your order, please don't hesitate to reply to this email.

${companyName}
${flushjohn_phone ? `Phone: ${flushjohn_phone}` : ""}
${flushjohn_email ? `Email: ${flushjohn_email}` : ""}
${flushjohn_website ? `Website: ${flushjohn_website}` : ""}
    `.trim();

    // Prepare email options
    const emailOptions: any = {
      from: `${companyName} <${emailConfig.user}>`,
      to: customerEmail,
      subject: subject,
      text: plainTextContent, // Plain text version prevents Gmail from collapsing
      html: emailContent,
      attachments: [],
      // Add headers to prevent Gmail from treating as promotional
      headers: {
        "X-Mailer": "FlushJohn Payment System",
        "X-Priority": "1",
        Importance: "high",
        "Auto-Submitted": "auto-generated", // Marks as transactional
        Precedence: "bulk", // Helps with delivery
        "X-Auto-Response-Suppress": "All", // Prevents auto-replies
        "List-Unsubscribe": `<mailto:${emailConfig.user}?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };

    // Attach logo as inline CID attachment (PNG format for better email client support)
    // This is how Stripe and other email services embed logos - as inline CID attachments
    try {
      const logoPath = join(
        __dirname,
        "../../../public/logos/logo_dark_theme.png"
      );
      const logoBuffer = readFileSync(logoPath);
      emailOptions.attachments.push({
        filename: "flushjohn-logo.png",
        content: logoBuffer,
        cid: "logo-flushjohn", // Content-ID for referencing in HTML
        contentType: "image/png",
        contentDisposition: "inline", // Critical: inline embeds it in HTML, not as separate attachment
      });
    } catch (logoError) {
      console.warn("⚠️  Could not attach logo to email:", logoError);
      // Continue without logo attachment
    }

    // Attach PDF if generated successfully
    if (pdfBuffer) {
      emailOptions.attachments.push({
        filename: `Payment_Receipt_${
          salesOrder.salesOrderNo || payment._id
        }.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }

    // Send email
    await transporter.sendMail(emailOptions);

    return true;
  } catch (error) {
    console.error("Error sending sales receipt email:", error);
    return false;
  }
};
