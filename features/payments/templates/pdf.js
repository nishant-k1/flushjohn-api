// @ts-nocheck
import styles from "../../quotes/templates/styles.js";
import { logoDataUris } from "../../../constants.js";
import { safeValue, safeCurrency } from "../../../utils/safeValue.js";
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

const htmlTemplate = (receiptData) => {
  if (!receiptData) return;
  const {
    // Payment information
    amount,
    createdAt,
    paymentMethod,
    cardLast4,
    cardBrand,
    transactionId,
    paymentId,
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
        : `Card Payment${
            cardLast4
              ? ` (•••• ${cardLast4})`
              : cardBrand
                ? ` (${cardBrand})`
                : ""
          }`;

  const formattedSalesOrderDate = salesOrderCreatedAt
    ? new Date(salesOrderCreatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Calculate subtotal using single source of truth
  const subtotal =
    products && products.length > 0
      ? calculateOrderTotal(products)
      : parseFloat(amount || 0).toFixed(2);

  const referenceNumber = transactionId || paymentId || "N/A";

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
            <span class="payment-status-badge">✓ Payment Successful</span>
            <h1>Payment Receipt</h1>
            <h3>Date: ${paymentDate}</h3>
          </div>
        </div>
        <hr/>
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Bill To</h3>
              <p><strong>${safeValue(fName)} ${safeValue(lName)}</strong></p>
              ${cName ? `<p>${safeValue(cName)}</p>` : ""}
            </div>
            <div>
              <h3>Billing Address</h3>
              <p>${safeValue(streetAddress)}</p>
              <p>${safeValue(city)} ${safeValue(state)} ${safeValue(zip)}</p>
            </div>
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Sales Order #</h3>
              <p>${safeValue(salesOrderNo)}</p>
            </div>
            ${
              formattedSalesOrderDate
                ? `
            <div>
              <h3>Sales Order Date</h3>
              <p>${formattedSalesOrderDate}</p>
            </div>
            `
                : ""
            }
            <div>
              <h3>Payment Method</h3>
              <p>${paymentMethodDisplay}</p>
            </div>
            <div>
              <h3>Transaction Reference</h3>
              <p style="font-family: monospace; font-size: 0.75rem;">${referenceNumber}</p>
            </div>
            <div>
              <h3>Payment Date</h3>
              <p>${paymentDate}</p>
            </div>
          </div>
        </div>
      
        ${
          products && products.length > 0
            ? `
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
          ${itemRows(products)}
          
          <div class='totals-section'>
            <div class='total-row'>
              <span class='total-row-label'>Subtotal:</span>
              <span class='total-row-value'>${safeCurrency(subtotal)}</span>
            </div>
          </div>
        </div>
        `
            : ""
        }
        
        <div class='total-amount-container'>
          <h4>Amount Paid: ${safeCurrency(amount)}</h4>
        </div>
        
        <hr/>
        <div class='section-4' style="grid-template-columns: 1fr;">
          <div>
            <h3>Payment Confirmation</h3>
            <p style="margin-bottom: 0.5rem;">This receipt confirms that your payment of <strong>${safeCurrency(
              amount
            )}</strong> has been successfully processed on ${paymentDate}.</p>
            <p style="margin-bottom: 0.5rem;">Transaction Reference: <strong style="font-family: monospace;">${referenceNumber}</strong></p>
            <p style="margin-top: 1rem; font-weight: 500; color: #10b981;">✓ Payment Status: <strong>COMPLETED</strong></p>
            <p style="margin-top: 1rem;">Thank you for your business! We appreciate your trust in our services.</p>
            ${
              salesOrderNo
                ? `<p style="margin-top: 0.5rem; font-size: 0.8125rem; color: #666;">For questions about this payment, please reference Sales Order #${safeValue(
                    salesOrderNo
                  )}.</p>`
                : ""
            }
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
