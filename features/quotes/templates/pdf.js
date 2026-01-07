// @ts-nocheck
import styles from "./styles.js";
import { logoDataUris } from "../../../constants.js";
import {
  safeValue,
  safeCurrency,
  safePhone,
} from "../../../utils/safeValue.js";
import {
  calculateProductAmount,
  calculateOrderTotal,
} from "../../../utils/productAmountCalculations.js";

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

  // Calculate expiration date (default 30 days from creation)
  const expirationDays = quoteData.expirationDays || 30;
  const expirationDate = new Date(quoteData.createdAt);
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  const formattedExpirationDate = expirationDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate total from all products (tax is already included as a product)
  // Tax is calculated on client side and stored as a product in the array
  const products = quoteData.products || [];
  const total = parseFloat(calculateOrderTotal(products));

  // Payment terms for quotes
  const paymentTerms =
    quoteData.paymentTerms ||
    process.env.DEFAULT_QUOTE_PAYMENT_TERMS ||
    "Payment due upon acceptance of quote. 50% deposit required for long-term rentals.";

  return `<html>
      <head>
        <style>
          ${styles}
        </style>
      </head>
      <body>
        <div class="section-1">
          <div class="section-1-left">
            <img src="${logoDataUris.flushjohn}" alt="logo" class="logo" />
          </div>
          <div class="section-1-right">
            <span class="document-badge">Quote</span>
            <h1>Quote # ${safeValue(quoteData.quoteNo)}</h1>
            <h3>Date: ${createdAt}</h3>
          </div>
        </div>
        
        <div class="quote-expiration">
          <p><strong>Valid Until:</strong> ${formattedExpirationDate} (${expirationDays} days from quote date)</p>
        </div>
        
        <hr/>
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Bill To</h3>
              <p><strong>${safeValue(quoteData.fName)} ${safeValue(
    quoteData.lName
  )}</strong></p>
              ${quoteData.cName ? `<p>${safeValue(quoteData.cName)}</p>` : ""}
            </div>
            <div>
              <h3>Delivery Address</h3>
              <p>${safeValue(quoteData.streetAddress)}</p>
              <p>${safeValue(quoteData.city)} ${safeValue(
    quoteData.state
  )} ${safeValue(quoteData.zip)}</p>
            </div>
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Delivery Date</h3>
              <p>${deliveryDate || "To be determined"}</p>
            </div>
            <div>
              <h3>Pickup Date</h3>
              <p>${pickupDate || "To be determined"}</p>
            </div>
            ${
              quoteData.contactPersonName || quoteData.contactPersonPhone
                ? `
            <div>
              <h3>Onsite Contact</h3>
              ${
                quoteData.contactPersonName
                  ? `<p><strong>Name:</strong> ${safeValue(
                      quoteData.contactPersonName
                    )}</p>`
                  : ""
              }
              ${
                quoteData.contactPersonPhone
                  ? `<p><strong>Phone:</strong> ${safePhone(
                      quoteData.contactPersonPhone
                    )}</p>`
                  : ""
              }
            </div>
            `
                : ""
            }
            ${
              quoteData.instructions
                ? `
            <div>
              <h3>Special Instructions</h3>
              <p>${safeValue(quoteData.instructions)}</p>
            </div>
            `
                : ""
            }
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
          ${itemRows(quoteData.products || [])}
          
          <div class='total-amount-container'>
            <h4>Total Amount: ${safeCurrency(total.toFixed(2))}</h4>
          </div>
        </div>
        
        ${
          paymentTerms
            ? `
        <div class='payment-terms-section'>
          <h3>Payment Terms</h3>
          <p>${paymentTerms}</p>
          <p>Payment methods accepted: Credit Card or Payment Link</p>
        </div>
        `
            : ""
        }
        
        <hr/>
        <div class='section-4'>
          <div>
            <h3>Long Term Use</h3>
            <ul>
              <li>The billing cycle period is 28 days.</li>
              <li>Includes weekly cleaning service.</li>
              <li>If the service is extended beyond the first billing cycle period, the same amount will be charged for the next billing cycle.</li>
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
