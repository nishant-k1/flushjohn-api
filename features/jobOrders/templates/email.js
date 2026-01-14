// @ts-nocheck
import { getSitewayServicesEmailSignature } from "../../common/constants/emailSignatures.js";
import { safeDate } from "../../../utils/safeValue.js";

const template = (vendorData) => {
  // Extract user information from vendorData if available
  const user = vendorData.user || null;
  const email_signature = getSitewayServicesEmailSignature(user);

  const deliveryDate = safeDate(vendorData.deliveryDate, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Hi ${vendorData.vendorName || vendorData.fName || ""},

As per our conversation, I have attached the Job Order # ${
    vendorData.jobOrderNo ? vendorData.jobOrderNo : ""
  }.

The delivery date is ${deliveryDate}. Please go through the attachment for the onsite and other details.

Please acknowledge receipt of this Job Order by responding to this email stating "Received".

${email_signature}`;
};

export default template;
