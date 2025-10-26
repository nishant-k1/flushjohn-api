import { flushjohn } from "../../../../constants/index.js";

const template = ({ fName, lName, quoteNo }) => {
  const { cName, email_signature, phone } = flushjohn;

  return `Hi ${fName ? fName : ""} ${lName ? lName : ""},

Thank you for reaching out to ${cName} for a quote. We appreciate your interest in our products and services.

Attached is the Quote # ${
    quoteNo ? quoteNo : ""
  } you requested from Flush John. The PDF file contains all the details and pricing information.

If you have any questions or if you wish to place the order, please feel free to reply to this email or call us at: ${phone}.

${email_signature}`;
};

export default template;
