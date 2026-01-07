// @ts-nocheck
import { getFlushJohnEmailSignature } from "../../common/constants/emailSignatures.js";
import { calculateOrderTotal } from "../../../utils/productAmountCalculations.js";
import {
  calculateInvoiceExpirationDate,
  formatInvoiceExpirationDate,
} from "../../../utils/invoiceExpirationCalculations.js";
import { calculateBalanceDue } from "../../../utils/priceCalculations.js";

const template = (invoiceData) => {
  const email_signature = getFlushJohnEmailSignature();
  const flushjohn_cName = process.env.FLUSH_JOHN_COMPANY_NAME;

  // Calculate order total if not provided
  const orderTotal =
    invoiceData.orderTotal || calculateOrderTotal(invoiceData.products);

  // Calculate balance due using utility function
  const paidAmount = invoiceData.paidAmount || 0;
  const orderTotalNum =
    typeof orderTotal === "string" ? parseFloat(orderTotal) : orderTotal;
  const balanceDue = calculateBalanceDue(orderTotalNum, paidAmount);

  let paymentLinkSection = "";
  if (invoiceData.paymentLinkUrl) {
    // Calculate expiration date (24 hours from invoice creation)
    const invoiceDate = invoiceData.createdAt
      ? new Date(invoiceData.createdAt)
      : new Date();
    const expirationDate = calculateInvoiceExpirationDate(invoiceDate);
    const formattedExpirationDate = formatInvoiceExpirationDate(expirationDate);

    paymentLinkSection = `

PAYMENT LINK:
You can pay your invoice of $${
      balanceDue > 0
        ? balanceDue.toFixed(2)
        : typeof orderTotal === "string"
        ? orderTotal
        : orderTotal.toFixed(2)
    } by clicking the link below:
${invoiceData.paymentLinkUrl}

IMPORTANT: This payment link is valid for 24 hours only and will expire on ${formattedExpirationDate}. Please complete your payment before the expiration time.

If the link doesn't work, please copy and paste it into your browser.

This is a secure payment link powered by Stripe. You can safely enter your payment information.`;
  }

  const customerName =
    invoiceData.cName ||
    `${invoiceData.fName || ""} ${invoiceData.lName || ""}`.trim() ||
    "Valued Customer";

  return `Dear ${customerName},

Thank you for your business with ${flushjohn_cName}.

INVOICE DETAILS:
Sales Order #: ${invoiceData.salesOrderNo || "N/A"}
Invoice Date: ${
    invoiceData.createdAt
      ? new Date(invoiceData.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A"
  }
Order Total: $${
    typeof orderTotal === "string" ? orderTotal : orderTotal.toFixed(2)
  }
${paidAmount > 0 ? `Amount Paid: $${paidAmount.toFixed(2)}` : ""}
${
  balanceDue > 0
    ? `Balance Due: $${balanceDue.toFixed(2)}`
    : `Status: Paid in Full`
}${paymentLinkSection}

Please find your invoice attached to this email.

If you have any questions about this invoice, please don't hesitate to contact us.

${email_signature}`;
};

export default template;
