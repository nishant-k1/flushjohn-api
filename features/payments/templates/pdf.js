// @ts-nocheck
import styles from "../../quotes/templates/styles.js";
import { logoDataUris } from "../../../constants.js";
import { safeValue, safeCurrency } from "../../../utils/safeValue.js";
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

const htmlTemplate = (receiptData) => {
  if (!receiptData) return;
  const {
    // Payment information
    amount,
    createdAt,
    paymentMethod,
    cardLast4,
    cardBrand,
    // Customer information (flattened)
    fName,
    lName,
    cName,
    streetAddress,
    city,
    state,
    zip,
    // Sales order information
    salesOrderNo,
    salesOrderCreatedAt,
    // Products
    products,
  } = receiptData;

  const homepage = process.env.FLUSH_JOHN_HOMEPAGE;
  const email = process.env.FLUSH_JOHN_EMAIL_ID;
  const phone = process.env.FLUSH_JOHN_PHONE;
  const phone_link = process.env.FLUSH_JOHN_PHONE_LINK;

  const paymentDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const paymentMethodDisplay =
    paymentMethod === "payment_link"
      ? "Payment Link"
      : paymentMethod === "saved_card"
      ? `Saved Card${cardLast4 ? ` (•••• ${cardLast4})` : ""}`
      : `Card Payment${cardLast4 ? ` (•••• ${cardLast4})` : ""}`;

  const formattedSalesOrderDate = salesOrderCreatedAt
    ? new Date(salesOrderCreatedAt).toLocaleDateString("en-US", {
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
            <h1>Payment Receipt</h1>
            <h3>${paymentDate}</h3>
          </div>
        </div>
        <hr/>
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Customer Name</h3>
              <p>${fName || ""} ${" "}<span>${lName || ""}</span></p>
            </div>
            ${
              cName
                ? `
            <div>
              <h3>Company Name</h3>
              <p>${cName}</p>
            </div>
            `
                : ""
            }
            <div>
              <h3>Billing Address</h3>
              <p>${streetAddress || ""}</p>
              <p>${city || ""} ${state || ""} ${zip || ""}</p>
            </div>
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Sales Order #</h3>
              <p>${salesOrderNo || ""}</p>
            </div>
            <div>
              <h3>Sales Order Date</h3>
              <p>${formattedSalesOrderDate}</p>
            </div>
            <div>
              <h3>Payment Method</h3>
              <p>${paymentMethodDisplay}</p>
            </div>
            <div>
              <h3>Payment Date</h3>
              <p>${paymentDate}</p>
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
            ${itemRows(products || [])}
          <div class='total-amount-container'>
            <h4>Amount Paid: ${safeCurrency(amount)}</h4>
          </div>
        </div>
        <hr/>
        <div class='section-4'>
          <div>
            <h3>Payment Confirmation</h3>
            <p>This receipt confirms that your payment of ${safeCurrency(
              amount
            )} has been successfully processed.</p>
            <p>Thank you for your business!</p>
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
