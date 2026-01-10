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
import { minifyHTML } from "../../../utils/htmlMinifier.js";
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
    // Note: Contact fields (fName, lName, etc.) ONLY exist in lead object, not on sales order
    const salesOrderObj = salesOrder.toObject
      ? salesOrder.toObject()
      : salesOrder;

    // Validate required sales order fields
    if (!salesOrderObj.salesOrderNo) {
      throw new Error("Sales order number is required for receipt generation");
    }
    if (!salesOrderObj.createdAt) {
      throw new Error("Sales order creation date is required for receipt generation");
    }
    if (!salesOrderObj.products || !Array.isArray(salesOrderObj.products)) {
      throw new Error("Sales order products are required for receipt generation");
    }

    const lead = salesOrderObj.lead || {};
    if (!lead) {
      throw new Error("Lead information is required for receipt generation");
    }

    const receiptData = {
      // Payment information
      amount: payment.amount,
      createdAt: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      cardLast4: payment.cardLast4,
      cardBrand: payment.cardBrand,

      // Customer information (flattened from lead) - NO fallbacks, use database data only
      fName: lead.fName,
      lName: lead.lName,
      cName: lead.cName,
      email: lead.email,
      phone: lead.phone,
      streetAddress: lead.streetAddress,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,

      // Sales order information - NO fallbacks, use database data only
      salesOrderNo: salesOrderObj.salesOrderNo,
      salesOrderCreatedAt: salesOrderObj.createdAt,

      // Products (for itemized receipt) - NO fallbacks, use database data only
      products: salesOrderObj.products,

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
    // Generate email content
    const emailContentStartTime = Date.now();
    let emailContent = receiptEmailTemplate(emailData);
    const emailContentTime = Date.now() - emailContentStartTime;

    // OPTIMIZATION: Minify HTML email content (reduces size by 20-30%, faster delivery)
    // This does NOT change visual output - email clients render identically
    const minifyStartTime = Date.now();
    emailContent = minifyHTML(emailContent);
    const minifyTime = Date.now() - minifyStartTime;
    console.log(
      `⏱️ [Payment Receipt Email] Content generation: ${emailContentTime}ms | HTML minification: ${minifyTime}ms`
    );

    const companyName = process.env.FLUSH_JOHN_COMPANY_NAME || "Flush John";
    const flushjohn_phone = process.env.FLUSH_JOHN_PHONE;
    const flushjohn_email = process.env.FLUSH_JOHN_EMAIL_ID;
    const flushjohn_website =
      process.env.FLUSH_JOHN_HOMEPAGE || process.env.FLUSH_JOHN_WEBSITE_URL;
    const subject = `${companyName}: Payment Receipt - Sales Order #${salesOrderObj.salesOrderNo}`;

    // Validate payment date
    if (!payment.createdAt) {
      throw new Error("Payment creation date is required for receipt generation");
    }

    // Format payment date and method for plain text
    const paymentDate = safeDate(payment.createdAt, {
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
    // Use customer name from database (no fallbacks)
    const customerName = receiptData.fName
      ? `${receiptData.fName}${receiptData.lName ? ` ${receiptData.lName}` : ""}`
      : receiptData.cName || "";

    const plainTextContent = `
Payment Receipt - Sales Order #${salesOrderObj.salesOrderNo}

Hi ${customerName},

Your payment of ${safeCurrency(payment.amount)} has been successfully processed.

Payment Details:
- Sales Order #: ${salesOrderObj.salesOrderNo}
- Payment Date: ${paymentDate}
- Payment Method: ${paymentMethodDisplay}
- Amount Paid: ${safeCurrency(payment.amount)}

${
  salesOrderObj.products && salesOrderObj.products.length > 0
    ? `
Order Items:
${salesOrderObj.products
  .map((p: any) => {
    // Use database data only - no fallbacks
    const quantity = p.quantity ?? 0;
    const rate = p.rate ?? 0;
    const total = calculateProductAmount(quantity, rate);
    const itemName = p.item || p.productName || "";
    return `- ${itemName} (Quantity: ${quantity}) - $${total}`;
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
        filename: `Payment_Receipt_${salesOrderObj.salesOrderNo}.pdf`,
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
