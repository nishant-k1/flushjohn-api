import { flushjohn } from "../../../../constants/index.js";

const template = (salesOrderData) => {
  const { email_signature } = flushjohn;

  // Calculate order total if not provided
  const orderTotal = salesOrderData.orderTotal || 
    (salesOrderData.products && salesOrderData.products.length > 0
      ? salesOrderData.products.reduce((sum, p) => {
          const qty = parseFloat(p.qty) || 0;
          const rate = parseFloat(p.rate) || 0;
          return sum + qty * rate;
        }, 0)
      : 0);

  let paymentLinkSection = "";
  if (salesOrderData.paymentLinkUrl) {
    paymentLinkSection = `

PAYMENT LINK:
You can pay your invoice of $${orderTotal.toFixed(2)} by clicking the link below:
${salesOrderData.paymentLinkUrl}

Or copy and paste the link into your browser if the link doesn't work.`;
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
