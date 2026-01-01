import { flushjohn } from "../../../../constants/index.js";

const template = (invoiceData) => {
  const { email_signature } = flushjohn;
  
  // Calculate order total if not provided
  const orderTotal = invoiceData.orderTotal || 
    (invoiceData.products && invoiceData.products.length > 0
      ? invoiceData.products.reduce((sum, p) => {
          const qty = parseFloat(p.qty) || 0;
          const rate = parseFloat(p.rate) || 0;
          return sum + qty * rate;
        }, 0)
      : 0);

  // Calculate balance due
  const paidAmount = invoiceData.paidAmount || 0;
  const balanceDue = orderTotal - paidAmount;

  let paymentLinkSection = "";
  if (invoiceData.paymentLinkUrl) {
    paymentLinkSection = `

PAYMENT LINK:
You can pay your invoice of $${balanceDue > 0 ? balanceDue.toFixed(2) : orderTotal.toFixed(2)} by clicking the link below:
${invoiceData.paymentLinkUrl}

Or copy and paste the link into your browser if the link doesn't work.

This is a secure payment link powered by Stripe. You can safely enter your payment information.`;
  }

  const customerName = invoiceData.cName || 
    `${invoiceData.fName || ""} ${invoiceData.lName || ""}`.trim() ||
    "Valued Customer";

  return `Dear ${customerName},

Thank you for your business with ${flushjohn.cName}.

INVOICE DETAILS:
Sales Order #: ${invoiceData.salesOrderNo || "N/A"}
Invoice Date: ${invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
Order Total: $${orderTotal.toFixed(2)}
${paidAmount > 0 ? `Amount Paid: $${paidAmount.toFixed(2)}` : ""}
${balanceDue > 0 ? `Balance Due: $${balanceDue.toFixed(2)}` : `Status: Paid in Full`}${paymentLinkSection}

Please find your invoice attached to this email.

If you have any questions about this invoice, please don't hesitate to contact us.

${email_signature}`;
};

export default template;

