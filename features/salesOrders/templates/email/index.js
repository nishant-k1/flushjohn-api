import { flushjohn } from "../../../../constants/index.js";

const template = (salesOrderData) => {
  const { email_signature } = flushjohn;

  return `Hi ${salesOrderData.fName ? salesOrderData.fName : ""} ${
    salesOrderData.lName ? salesOrderData.lName : ""
  },

As per our conversation and given quote, we have created your Sales Order # ${
    salesOrderData.salesOrderNo
  }.

Please go through the attachment and verify if all the information provided is correct.

To confirm your order, please reply to this email stating "Approved".

${email_signature}`;
};

export default template;
