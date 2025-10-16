import styles from "./styles.js";
import {
  quengenesis,
  apiBaseUrls,
  s3assets,
  localAssetsUrl,
} from "../../../../constants/index.js";
import {
  safeValue,
  safeGet,
  safeDate,
  safeCurrency,
  safePhone,
} from "../../../../utils/safeValue.js";

const itemRows = (products) => {
  if (!products || !Array.isArray(products)) {
    return "";
  }

  return products
    .map((element, index) => {
      const { item, desc, qty, rate } = element || {};
      const safeQty = parseFloat(qty) || 0;
      const safeRate = parseFloat(rate) || 0;
      const total = safeQty * safeRate;

      return `<ul key=${index} id=${index} class='items-list'>
        <li>
          <p>${safeValue(item)}</p>
        </li>
        <li>
          <p>${safeValue(desc)}</p>
        </li>
        <li>
          <p>${safeValue(qty)}</p>
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

const totalAmount = (products) => {
  if (!products || !Array.isArray(products)) {
    return 0;
  }
  return products.reduce((accumulator, currentValue) => {
    const qty = parseFloat(currentValue.qty) || 0;
    const rate = parseFloat(currentValue.rate) || 0;
    return accumulator + qty * rate;
  }, 0);
};

const htmlTemplate = (jobOrderData) => {
  if (!jobOrderData) return;
  const { cName, address, homepage, email, phone, phone_link } = quengenesis;
  const { CRM_BASE_URL } = apiBaseUrls;

  const createdAt = safeDate(jobOrderData.createdAt);
  const deliveryDate = safeDate(jobOrderData.deliveryDate);
  const pickupDate = safeDate(jobOrderData.pickupDate);

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
              <img src="${localAssetsUrl}/logos/logo_quengenesis.svg" alt="logo" class="logo" style="max-width: 80px !important; width: 80px !important; height: 40px !important; object-fit: contain !important;" />          
            <div>
              <h4>${cName}</h4>
              ${address ? `<p>${address}</p>` : ""}
              <p><strong>Email: </strong>${email}</p>
              <p><strong>Phone: </strong>${phone}</p>
            </div>
            </div>
            <div>
            <h3 style="font-size:x-large">Customer</h3>
            <h4>${safeValue(jobOrderData.fName)} ${safeValue(
    jobOrderData.lName
  )}</h4>
            ${
              jobOrderData.cName
                ? `<p>${safeValue(jobOrderData.cName)}</p>`
                : ""
            }
            <p><strong>Email: </strong>${safeValue(jobOrderData.email)}</p>
            <p><strong>Phone: </strong>${safePhone(jobOrderData.phone)}</p>
            </div>
            <div>
            <h3 style="font-size:x-large">Vendor</h3>
            <h4>${safeGet(jobOrderData, "vendor.name")}</h4>
            <p>${safeGet(jobOrderData, "vendor.streetAddress")}</p>
            <p>${safeGet(jobOrderData, "vendor.city")} ${safeGet(
    jobOrderData,
    "vendor.state"
  )} ${safeGet(jobOrderData, "vendor.zip")}</p>
            <p><strong>Email: </strong>${safeGet(
              jobOrderData,
              "vendor.email"
            )}</p>
            <p><strong>Phone: </strong>${safePhone(
              safeGet(jobOrderData, "vendor.phone")
            )}</p>
            <p><strong>Fax: </strong>${safePhone(
              safeGet(jobOrderData, "vendor.fax")
            )}</p>
          </div>
          </div>

          <div class="section-1-right">
            <h1>Job Order # ${safeValue(jobOrderData.jobOrderNo)}</h1>
            <h3>${createdAt}</h3>
          </div>
        </div>
        <hr/>
      <div class="section-2">
        <div class='section-2-left'>
          <div>
            <h3>Delivery Address</h3>
            <p>${safeValue(jobOrderData.streetAddress)}</p>
            <p>${safeValue(jobOrderData.city)} ${safeValue(
    jobOrderData.state
  )} ${safeValue(jobOrderData.zip)}</p>
          </div>
          <div>
          <h3>Instructions</h3>
          <p>${safeValue(jobOrderData.instructions)}</p>
        </div>
        <div>
          <h3>Onsite Contact Person Details</h3>
          <p><strong>Name: </strong>${safeValue(
            jobOrderData.contactPersonName
          )}</p>
          <p><strong>Phone: </strong>${safePhone(
            jobOrderData.contactPersonPhone
          )}</p>
        </div>
        </div>

        <div class='section-2-right'>
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
          ${itemRows(jobOrderData.products)}
        <div>
          <h4>Total Amount ${safeCurrency(
            totalAmount(jobOrderData.products)
          )}</h4>
        </div>
      </div>
      <hr/>
      <div>
       <h3>By accepting this Job Order, Vendor (Receiver of the Job Order) agrees</h3>

        <div class='section-4'>
          <ul>
            <li>
              not to accept work, enter into an agreement or accept an obligation with any of the client/customers, whose job has been assigned to the vendor via this job order.
            </li>
            <li>
              not to ask for work, contact, or support in the servicing of client/customer specified in the Job Orders issued by this Company to the vendor in order to
              <ul class='inner'>
                <li>
                  persuade Company's clients/prospects to cancel, transfer or cease doing business in whole or in part with the Company or
                </li>
                <li>
                  persuade Company's clients/prospects to do business with any person or business entity in competition with the business of the Company as conducted as of the date of this Agreement.
                </li>
              </ul>
            </li>
            <li>
              to maintain the necessary General Liability Insurance, Worker’s Compensation Insurance, Disability Insurance, Auto Accident, Auto Theft, Auto Damage and Property Damage or Loss insurance. Also, agrees to be responsible for any claims by the Quengenesis LLC customers while the equipment is in use.
            </li>
          </ul>
        </div>
      </div>
      <footer>
      <ul>
        <li><a href=${homepage}>${homepage}</a></li>
        <li><a href=mailto:${email}>${email}</a></li>
        <li><a href="tel:${phone_link}">${phone}</a></li>
      </ul>
      </footer>
    </body>
  </html>
`;
};

export default htmlTemplate;
