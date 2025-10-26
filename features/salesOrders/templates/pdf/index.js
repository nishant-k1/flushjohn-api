import styles from "./styles.js";
import {
  flushjohn,
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

const htmlTemplate = (salesOrderData) => {
  if (!salesOrderData) return;
  const { homepage, email, phone, phone_link } = flushjohn;

  const createdAt = new Date(salesOrderData.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const deliveryDate = new Date(salesOrderData.deliveryDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const pickupDate = new Date(salesOrderData.pickupDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return `<html>
      <head>
        <style>
          ${styles}
        </style>
      </head>
      <body>
        <div class="section-1">
        <img src="${localAssetsUrl}/logos/flush_john_logo_black.svg" alt="logo" class="logo" style="max-width: 100px !important; width: 100px !important; height: 60px !important; object-fit: contain !important;" />          
          <div class="section-1-right">
          <h1>Customer No. # ${
            salesOrderData.customerNo ? salesOrderData.customerNo : ""
          }</h1>
            <h1>Sales Order No. # ${
              salesOrderData.salesOrderNo ? salesOrderData.salesOrderNo : ""
            }</h1>
            <h3>${salesOrderData.createdAt ? createdAt : ""}</h3>
          </div>
        </div>
        <hr/>
        <div class="section-2">
          <div class='section-2-left'>
            <div>
              <h3>Customer Name</h3>
              <p>${salesOrderData.fName ? salesOrderData.fName : ""}
                ${" "}<span>${
    salesOrderData.lName ? salesOrderData.lName : ""
  }</span>
              </p>
            </div>
            ${
              salesOrderData.cName
                ? `
            <div>
              <h3>Company Name</h3>
              <p>${salesOrderData.cName}</p>
            </div>
            `
                : ""
            }
            <div>
              <h3>Delivery Address</h3>
              <p>${
                salesOrderData.streetAddress ? salesOrderData.streetAddress : ""
              }</p>
              <p>${salesOrderData.city ? salesOrderData.city : ""} ${
    salesOrderData.state ? salesOrderData.state : ""
  } ${salesOrderData.zip ? salesOrderData.zip : ""}</p>
            </div>
          </div>

          <div class='section-2-right'>
            <div>
              <h3>Delivery Date</h3>
              <p>${
                salesOrderData.deliveryDate ? deliveryDate : ""
              }</p>            
            </div>
            <div>
              <h3>Pickup Date</h3>
              <p>${salesOrderData.pickupDate ? pickupDate : ""}</p>
            </div>
            <div>
              <h3>Instructions</h3>
              <p>${
                salesOrderData.instructions ? salesOrderData.instructions : ""
              }</p>
            </div>
            <div>
              <h3>Onsite Contact Person Details</h3>
              <p>Name: ${
                salesOrderData.contactPersonName
                  ? salesOrderData.contactPersonName
                  : ""
              } </p>
              <p>Phone: ${
                salesOrderData.contactPersonPhone
                  ? salesOrderData.contactPersonPhone
                  : ""
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
            ${itemRows(salesOrderData.products)}
          <div>
            <h4>Total Amount $${totalAmount(salesOrderData.products)}</h4>
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
