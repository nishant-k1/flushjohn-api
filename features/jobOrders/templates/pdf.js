// @ts-nocheck
import styles from "./styles.js";
import { getLogoDataUris } from "../../../utils/pdfAssets.js";
import {
  safeValue,
  safeGet,
  safeDate,
  safeCurrency,
  safePhone,
} from "../../../utils/safeValue.js";
import {
  calculateProductAmount,
  calculateOrderTotal,
} from "../../../utils/productAmountCalculations.js";

/**
 * Get environment variable dynamically by prefix
 * @param prefix - Environment variable prefix (e.g., "FLUSH_JOHN", "SITEWAY_SERVICES")
 * @param varName - Variable name without prefix (e.g., "EMAIL_ID")
 * @returns Environment variable value or undefined
 */
function getEnvVar(prefix, varName) {
  return process.env[`${prefix}_${varName}`];
}

const itemRows = (products) => {
  if (!products || !Array.isArray(products)) {
    return "";
  }

  return products
    .map((element, index) => {
      const { item, desc, quantity, rate } = element || {};
      const safeQuantity = parseFloat(quantity) || 0;
      const safeRate = parseFloat(rate) || 0;
      const total = calculateProductAmount(safeQuantity, safeRate);

      return `<ul key=${index} id=${index} class='items-list'>
        <li>
          <p>${safeValue(item)}</p>
        </li>
        <li>
          <p>${safeValue(desc)}</p>
        </li>
        <li>
          <p>${safeValue(quantity)}</p>
        </li>
        <li>
          <p>${safeCurrency(rate)}</p>
        </li>
        <li>
          <p>${safeCurrency(total)}</p>
        </li>
      </ul>`;
    })
    .join("");
};

const htmlTemplate = (jobOrderData) => {
  if (!jobOrderData) return;
  // Get company environment variables directly from .env using dynamic prefix
  const envPrefix = "SITEWAY_SERVICES";
  const cName = getEnvVar(envPrefix, "COMPANY_NAME");
  const address = getEnvVar(envPrefix, "ADDRESS");
  const homepage = getEnvVar(envPrefix, "HOMEPAGE");
  const email = getEnvVar(envPrefix, "EMAIL_ID");
  const phone = getEnvVar(envPrefix, "PHONE");
  const phone_link = getEnvVar(envPrefix, "PHONE_LINK");

  const createdAt = safeDate(jobOrderData.createdAt, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deliveryDate = safeDate(jobOrderData.deliveryDate, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pickupDate = safeDate(jobOrderData.pickupDate, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate total from all products (tax is already included as a product)
  // Tax is calculated on client side and stored as a product in the array
  const products = jobOrderData.products || [];
  const total = parseFloat(calculateOrderTotal(products));

  return `<html>
    <head>
      <style>
        ${styles}
      </style>
    </head>
      <body>
        <div class="section-1">
          <div class="section-1-left">
            <div>
              <img src="${getLogoDataUris().sitewayServices}" alt="logo" class="logo" style="max-width: 150px !important; width: 150px !important; height: 75px !important; object-fit: contain !important;" />
              <div style="margin-top: 0.5rem;">
                <h4>${cName}</h4>
                ${
                  address
                    ? `<p style="font-size: 0.75rem; color: #666;">${address}</p>`
                    : ""
                }
                <p style="font-size: 0.75rem; color: #666;"><strong>Email: </strong>${email}</p>
                <p style="font-size: 0.75rem; color: #666;"><strong>Phone: </strong>${safePhone(phone)}</p>
              </div>
            </div>
          </div>
          <div class="section-1-right">
            <span class="document-badge">Job Order</span>
            <h1>Job Order # ${safeValue(jobOrderData.jobOrderNo)}</h1>
            <h3>Date: ${createdAt}</h3>
          </div>
        </div>
        <hr/>
        
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Customer</h3>
              <p><strong>${safeValue(jobOrderData.fName)} ${safeValue(
                jobOrderData.lName
              )}</strong></p>
              ${
                jobOrderData.cName
                  ? `<p>${safeValue(jobOrderData.cName)}</p>`
                  : ""
              }
              ${
                jobOrderData.email
                  ? `<p><strong>Email: </strong>${safeValue(
                      jobOrderData.email
                    )}</p>`
                  : ""
              }
              ${
                jobOrderData.phone
                  ? `<p><strong>Phone: </strong>${safePhone(
                      jobOrderData.phone
                    )}</p>`
                  : ""
              }
            </div>
            <div>
              <h3>Delivery Address</h3>
              <p>${safeValue(jobOrderData.streetAddress)}</p>
              <p>${safeValue(jobOrderData.city)} ${safeValue(
                jobOrderData.state
              )} ${safeValue(jobOrderData.zip)}</p>
            </div>
            ${
              jobOrderData.instructions
                ? `
            <div>
              <h3>Special Instructions</h3>
              <p>${safeValue(jobOrderData.instructions)}</p>
            </div>
            `
                : ""
            }
            ${
              jobOrderData.contactPersonName || jobOrderData.contactPersonPhone
                ? `
            <div>
              <h3>Onsite Contact</h3>
              ${
                jobOrderData.contactPersonName
                  ? `<p><strong>Name: </strong>${safeValue(
                      jobOrderData.contactPersonName
                    )}</p>`
                  : ""
              }
              ${
                jobOrderData.contactPersonPhone
                  ? `<p><strong>Phone: </strong>${safePhone(
                      jobOrderData.contactPersonPhone
                    )}</p>`
                  : ""
              }
            </div>
            `
                : ""
            }
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Vendor</h3>
              <p><strong>${safeGet(jobOrderData, "vendor.name")}</strong></p>
              <p>${safeGet(jobOrderData, "vendor.streetAddress")}</p>
              <p>${safeGet(jobOrderData, "vendor.city")} ${safeGet(
                jobOrderData,
                "vendor.state"
              )} ${safeGet(jobOrderData, "vendor.zip")}</p>
              ${
                safeGet(jobOrderData, "vendor.email")
                  ? `<p><strong>Email: </strong>${safeGet(
                      jobOrderData,
                      "vendor.email"
                    )}</p>`
                  : ""
              }
              ${
                safeGet(jobOrderData, "vendor.phone")
                  ? `<p><strong>Phone: </strong>${safePhone(
                      safeGet(jobOrderData, "vendor.phone")
                    )}</p>`
                  : ""
              }
              ${
                safeGet(jobOrderData, "vendor.fax")
                  ? `<p><strong>Fax: </strong>${safePhone(
                      safeGet(jobOrderData, "vendor.fax")
                    )}</p>`
                  : ""
              }
            </div>
            <div>
              <h3>Delivery Date</h3>
              <p>${deliveryDate}</p>
            </div>
            <div>
              <h3>Pickup Date</h3>
              <p>${pickupDate}</p>
            </div>
          </div>
        </div>
    
      <div class='section-3'>
        <ul class='items-heading'>
          <li>
            <h3>ITEMS</h3>
          </li>
          <li>
            <h3>DESCRIPTION</h3>
          </li>
          <li>
            <h3>QTY</h3>
          </li>
          <li>
            <h3>RATE</h3>
          </li>
          <li>
            <h3>TOTAL</h3>
          </li>
        </ul>
          ${itemRows(jobOrderData.products || [])}
          
          <div class='total-amount-container'>
            <h4>Total Amount: ${safeCurrency(total)}</h4>
          </div>
      </div>
      
      <hr/>
        <div class='section-4'>
        <div style="grid-column: 1 / -1;">
          <h3>By accepting this Job Order, the vendor agrees:</h3>
          <ul>
            <li>
              Not to accept work, enter into an agreement, or accept an obligation with any client/customer whose job has been assigned to the vendor via this job order.
            </li>
            <li>
              Not to ask for work, contact, or support in the servicing of clients/customers specified in the Job Orders issued by this Company to the vendor to:
              <ul class='inner' style="margin-top: 0.5rem; padding-left: 1.5rem;">
                <li>
                  Persuade the Company's clients/prospects to cancel, transfer, or cease doing business in whole or in part with the Company; or
                </li>
                <li>
                  Persuade the Company's clients/prospects to do business with any person or business entity in competition with the business of the Company as conducted as of the date of this Agreement.
                </li>
              </ul>
            </li>
            <li>
              To maintain the necessary General Liability Insurance, Workers' Compensation Insurance, Disability Insurance, Auto Accident, Auto Theft, Auto Damage, and Property Damage or Loss insurance. The vendor also agrees to be responsible for any claims by Siteway Services customers while the equipment is in use.
            </li>
          </ul>
        </div>
      </div>
      <footer>
      <ul>
        <li><a href=${homepage}>${homepage}</a></li>
        <li><a href=mailto:${email}>${email}</a></li>
          <li><a href=tel:${phone_link}>${phone}</a></li>
      </ul>
      </footer>
    </body>
  </html>
`;
};

export default htmlTemplate;
