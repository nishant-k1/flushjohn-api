// @ts-nocheck
import styles from "./styles.js";
import { logoDataUris } from "../../../constants.js";
import {
  safeValue,
  safeGet,
  safeDate,
  safeCurrency,
  safePhone,
} from "../../../utils/safeValue.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";

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

const totalAmount = (products) => {
  if (!products || !Array.isArray(products)) {
    return 0;
  }
  return products.reduce((accumulator, currentValue) => {
    const quantity = parseFloat(currentValue.quantity) || 0;
    const rate = parseFloat(currentValue.rate) || 0;
    return accumulator + parseFloat(calculateProductAmount(quantity, rate));
  }, 0);
};

const htmlTemplate = (quoteData) => {
  const homepage = process.env.FLUSH_JOHN_HOMEPAGE;
  const email = process.env.FLUSH_JOHN_EMAIL_ID;
  const phone = process.env.FLUSH_JOHN_PHONE;
  const phone_link = process.env.FLUSH_JOHN_PHONE_LINK;

  if (!quoteData) return;

  const createdAt = new Date(quoteData.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deliveryDate = quoteData.deliveryDate
    ? new Date(quoteData.deliveryDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const pickupDate = quoteData.pickupDate
    ? new Date(quoteData.pickupDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return `<html>
      <head>
        <style>
          ${styles}
        </style>
      </head>
      <body>
        <div class="section-1">
          <img src="${
            logoDataUris.flushjohn
          }" alt="logo" class="logo" style="max-width: 100px !important; width: 100px !important; height: 60px !important; object-fit: contain !important;" />
          <div class="section-1-right">
            <h1>Quote No. # ${quoteData.quoteNo || ""}</h1>
            <h3>${createdAt || ""}</h3>
          </div>
        </div>
        <hr/>
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Customer Name</h3>
              <p>${quoteData.fName || ""}
                <span>
                  ${" "}${quoteData.lName ? quoteData.lName : ""}
                </span>
              </p>
            </div>
            ${
              quoteData.cName
                ? `
            <div>
              <h3>Company Name</h3>
              <p>${quoteData.cName}</p>
            </div>
            `
                : ""
            }
            <div>
              <h3>Delivery Address</h3>
              <p>${quoteData.streetAddress ? quoteData.streetAddress : ""}</p>
              <p>${quoteData.city ? quoteData.city : ""} ${
    quoteData.state ? quoteData.state : ""
  } ${quoteData.zip ? quoteData.zip : ""}</p>
            </div>
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Delivery Date</h3>
              <p>${quoteData.deliveryDate ? deliveryDate : ""}</p>
            </div>
            <div>
              <h3>Pickup Date</h3>
              <p>${quoteData.pickupDate ? pickupDate : ""}</p>
            </div>
            <div>
            <h3>Instructions</h3>
            <p>${quoteData.instructions ? quoteData.instructions : ""}</p>
          </div>
          <div>
            <h3>Onsite Contact Person Details</h3>
            <p>Name: ${
              quoteData.contactPersonName ? quoteData.contactPersonName : ""
            } </p>
            <p>Phone: ${
              quoteData.contactPersonPhone ? quoteData.contactPersonPhone : ""
            }</p>
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
            ${quoteData.products ? itemRows(quoteData.products) : ""}
          <div class='total-amount-container'>
            <h4>Total Amount: ${
              quoteData.products
                ? safeCurrency(totalAmount(quoteData.products))
                : "$0.00"
            }</h4>
          </div>
        </div>
        <hr/>
        <div class='section-4'>
          <div>
            <h3>Long Term Use</h3>
            <ul>
              <li>The billing cycle period is 28 days.</li>
              <li>Includes weekly cleaning service.</li>
              <li>If the service is extended after the end of the first billing cycle period, the same amount will be charged for the next month.</li>
            </ul>
          </div>
          <div>
            <h3>Short Term Use</h3>
            <ul>
              <li>On weekends, we deliver on Friday and pick up on Monday.</li>
              <li>On weekdays, we deliver a day before your event and pick up the day after your event.</li>
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
    </html>`;
};

export default htmlTemplate;
