import { quengenesis } from "../../../../constants/index.js";

const template = (vendorData) => {
  const { email_signature } = quengenesis;

  const deliveryDate = new Date(vendorData.deliveryDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return `Hi ${vendorData.vendorName || vendorData.fName || ""},

As per our conversation, I have attached the Job_Order # ${
    vendorData.jobOrderNo ? vendorData.jobOrderNo : ""
  }.

The delivery date is ${
    vendorData.deliveryDate ? deliveryDate : ""
  }. Please go through the attachment for the onsite and other details.

Please acknowledge receipt of this Job Order by responding to this email stating "Received".

${email_signature}`;
};

export default template;
