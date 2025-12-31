import { flushjohn } from "../../../../constants/index.js";

/**
 * Sales Receipt Email Template
 * Sent after successful payment
 */
const template = (paymentData) => {
  const { email_signature } = flushjohn;
  const { salesOrder, amount, createdAt, paymentMethod, cardLast4 } = paymentData;

  const paymentMethodDisplay = 
    paymentMethod === "payment_link"
      ? "Payment Link"
      : paymentMethod === "saved_card"
      ? `Saved Card${cardLast4 ? ` (•••• ${cardLast4})` : ""}`
      : `Card Payment${cardLast4 ? ` (•••• ${cardLast4})` : ""}`;

  const paymentDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const customerName = salesOrder?.lead?.fName && salesOrder?.lead?.lName
    ? `${salesOrder.lead.fName} ${salesOrder.lead.lName}`
    : salesOrder?.lead?.fName || "Customer";

  return `Hi ${customerName},

Thank you for your payment!

PAYMENT RECEIPT

Sales Order #: ${salesOrder?.salesOrderNo || "N/A"}
Payment Amount: $${amount.toFixed(2)}
Payment Date: ${paymentDate}
Payment Method: ${paymentMethodDisplay}
Status: Paid

Your payment of $${amount.toFixed(2)} has been successfully processed.

If you have any questions about this payment, please reply to this email.

${email_signature}`;
};

export default template;

