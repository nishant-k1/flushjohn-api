/**
 * Send Sales Receipt Email
 * Sends receipt email after successful payment
 */

import { getPooledTransporter } from "../../common/services/emailService.js";
import salesReceiptEmailTemplate from "../templates/email.js";
import { flushjohn } from "../../../constants.js";
import * as salesOrdersRepository from "../../salesOrders/repositories/salesOrdersRepository.js";

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

    // Prepare email data
    const emailData = {
      salesOrder: salesOrder.toObject ? salesOrder.toObject() : salesOrder,
      amount: payment.amount,
      createdAt: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      cardLast4: payment.cardLast4,
    };

    // Get email configuration
    const emailConfig = {
      user: process.env.NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID,
      pass: process.env.FLUSH_JOHN_EMAIL_PASSWORD,
    };

    // Get pooled transporter
    const transporter = await getPooledTransporter(emailConfig);

    // Generate email content
    const emailContent = salesReceiptEmailTemplate(emailData);
    const subject = `${flushjohn.cName}: Payment Receipt - Sales Order #${salesOrder.salesOrderNo}`;

    // Send email
    await transporter.sendMail({
      from: `${flushjohn.cName} <${emailConfig.user}>`,
      to: customerEmail,
      subject: subject,
      html: emailContent,
    });

    return true;
  } catch (error) {
    console.error("Error sending sales receipt email:", error);
    return false;
  }
};

