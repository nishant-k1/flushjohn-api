// @ts-nocheck
import styles from "./styles.js";
import { logoDataUris } from "../../../constants.js";
import {
  safeValue,
  safeCurrency,
  safePhone,
} from "../../../utils/safeValue.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";
import { calculateOrderTotalsWithTax } from "../../../utils/taxCalculations.js";
import {
  calculateInvoiceExpirationDate,
  formatInvoiceExpirationDate,
} from "../../../utils/invoiceExpirationCalculations.js";

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

const htmlTemplate = (salesOrderData) => {
  if (!salesOrderData) return;
  const homepage = process.env.FLUSH_JOHN_HOMEPAGE;
  const email = process.env.FLUSH_JOHN_EMAIL_ID;
  const phone = process.env.FLUSH_JOHN_PHONE;
  const phone_link = process.env.FLUSH_JOHN_PHONE_LINK;

  const createdAt = new Date(salesOrderData.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const deliveryDate = salesOrderData.deliveryDate
    ? new Date(salesOrderData.deliveryDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const pickupDate = salesOrderData.pickupDate
    ? new Date(salesOrderData.pickupDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Calculate totals using single source of truth
  const totals = calculateOrderTotalsWithTax(
    salesOrderData.products || [],
    salesOrderData.taxRate
  );

  // Payment terms - can be customized via environment or default
  const paymentTerms =
    salesOrderData.paymentTerms ||
    process.env.DEFAULT_PAYMENT_TERMS ||
    "Net 30 - Payment due within 30 days of invoice date";

  // Calculate invoice expiration (24 hours from creation) if payment link exists
  let invoiceValiditySection = "";
  if (salesOrderData.paymentLinkUrl) {
    const invoiceDate = new Date(salesOrderData.createdAt);
    const expirationDate = calculateInvoiceExpirationDate(invoiceDate);
    const formattedExpirationDate = formatInvoiceExpirationDate(expirationDate);
    invoiceValiditySection = `
        <div class='quote-expiration' style="margin-top: 1rem;">
          <p><strong>Invoice Payment Link Validity:</strong> This invoice payment link is valid for 24 hours only and will expire on ${formattedExpirationDate}. Please complete your payment before the expiration time.</p>
        </div>
        `;
  }

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
            <span class="document-badge">Sales Order</span>
            <h1>Sales Order # ${safeValue(salesOrderData.salesOrderNo)}</h1>
            ${
              salesOrderData.customerNo
                ? `<h3>Customer No. # ${safeValue(
                    salesOrderData.customerNo
                  )}</h3>`
                : ""
            }
            <h3>Date: ${createdAt}</h3>
          </div>
        </div>
        <hr/>
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Bill To</h3>
              <p><strong>${safeValue(salesOrderData.fName)} ${safeValue(
    salesOrderData.lName
  )}</strong></p>
              ${
                salesOrderData.cName
                  ? `<p>${safeValue(salesOrderData.cName)}</p>`
                  : ""
              }
            </div>
            <div>
              <h3>Delivery Address</h3>
              <p>${safeValue(salesOrderData.streetAddress)}</p>
              <p>${safeValue(salesOrderData.city)} ${safeValue(
    salesOrderData.state
  )} ${safeValue(salesOrderData.zip)}</p>
            </div>
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Delivery Date</h3>
              <p>${deliveryDate || "Not specified"}</p>            
            </div>
            <div>
              <h3>Pickup Date</h3>
              <p>${pickupDate || "Not specified"}</p>
            </div>
            ${
              salesOrderData.contactPersonName ||
              salesOrderData.contactPersonPhone
                ? `
            <div>
              <h3>Onsite Contact</h3>
              ${
                salesOrderData.contactPersonName
                  ? `<p><strong>Name:</strong> ${safeValue(
                      salesOrderData.contactPersonName
                    )}</p>`
                  : ""
              }
              ${
                salesOrderData.contactPersonPhone
                  ? `<p><strong>Phone:</strong> ${safePhone(
                      salesOrderData.contactPersonPhone
                    )}</p>`
                  : ""
              }
            </div>
            `
                : ""
            }
            ${
              salesOrderData.instructions
                ? `
            <div>
              <h3>Special Instructions</h3>
              <p>${safeValue(salesOrderData.instructions)}</p>
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
          ${itemRows(salesOrderData.products || [])}
          
          <div class='totals-section'>
            <div class='total-row'>
              <span class='total-row-label'>Subtotal:</span>
              <span class='total-row-value'>${safeCurrency(
                totals.subtotal
              )}</span>
            </div>
            ${
              totals.taxRate > 0
                ? `
            <div class='total-row'>
              <span class='total-row-label'>Tax (${totals.taxRate}%):</span>
              <span class='total-row-value'>${safeCurrency(
                totals.taxAmount
              )}</span>
            </div>
            `
                : ""
            }
          </div>
          
          <div class='total-amount-container'>
            <h4>Total Amount: ${safeCurrency(totals.total)}</h4>
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
        ${invoiceValiditySection}
        
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
