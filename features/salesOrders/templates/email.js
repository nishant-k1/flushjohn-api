// @ts-nocheck
import { getFlushJohnEmailSignature } from "../../common/constants/emailSignatures.js";
import { calculateOrderTotal } from "../../../utils/productAmountCalculations.js";

const template = (salesOrderData) => {
  const email_signature = getFlushJohnEmailSignature();

  // Calculate order total if not provided
  // Handle both number (from DB) and string (from calculateOrderTotal)
  const orderTotal =
    salesOrderData.orderTotal || calculateOrderTotal(salesOrderData.products);
  // Ensure consistent string format for display
  const orderTotalDisplay =
    typeof orderTotal === "string" ? orderTotal : orderTotal.toFixed(2);

  let paymentLinkSection = "";
  if (salesOrderData.paymentLinkUrl) {
    paymentLinkSection = `

PAYMENT LINK:
You can pay your invoice of $${orderTotalDisplay} by clicking the link below:
${salesOrderData.paymentLinkUrl}

If the link doesn't work, please copy and paste it into your browser.`;
  }

  return `Hi ${salesOrderData.fName ? salesOrderData.fName : ""} ${
    salesOrderData.lName ? salesOrderData.lName : ""
  },

As per our conversation and given quote, we have created your Sales Order # ${
    salesOrderData.salesOrderNo
  }.

Please go through the attachment and verify if all the information provided is correct.

To confirm your order, please reply to this email stating "Approved".${paymentLinkSection}

${email_signature}`;
};

export default template;
