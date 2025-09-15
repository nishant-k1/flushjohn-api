import styles from "./styles.js";

const itemRows = (products) => {
  return products
    .map((element, { index }) => {
      const { item, desc, qty, rate } = element;
      const total = qty * rate;
      return `<ul key=${index} id=${index} class='items-list'>
        <li>
          <p>${item}</p>
        </li>
        <li>
          <p>${desc}</p>
        </li>
        <li>
          <p>${qty}</p>
        </li>
        <li>
          <p>$${rate}</p>
        </li>
        <li>
          <p>$${total}</p>
        </li>
      </ul>`;
    })
    .join("");
};

const totalAmount = (products) => {
  if (!products) {
    return 0; // Return 0 if products is undefined
  }
  return products.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.qty * currentValue.rate;
  }, 0);
};

const htmlTemplate = (jobOrderData) => {
  if (!jobOrderData) return;
  // const { cName, address, homepage, email, phone, phone_link } = quengenesis;
  // const { CRM_BASE_URL } = apiBaseUrls;

  const createdAt = new Date(jobOrderData.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const deliveryDate = new Date(jobOrderData.deliveryDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const pickupDate = new Date(jobOrderData.pickupDate).toLocaleDateString(
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
          <div class="section-1-left">
 
      
            </div>
            </div>
            <div>
            <h3 style="font-size:x-large">Vendor</h3>
            <h4>${jobOrderData.vendor.name ? jobOrderData.vendor.name : ""}</h4>
            <p>${
              jobOrderData.vendor.streetAddress
                ? jobOrderData.vendor.streetAddress
                : ""
            }</p>
            <p>${jobOrderData.vendor.city ? jobOrderData.vendor.city : ""} ${
    jobOrderData.vendor.state ? jobOrderData.vendor.state : ""
  } ${jobOrderData.vendor.zip ? jobOrderData.vendor.zip : ""}</p>
            <p><strong>Email: </strong>${
              jobOrderData.vendor.email ? jobOrderData.vendor.email : ""
            }</p>
            <p><strong>Phone: </strong> ${
              jobOrderData.vendor.phone ? jobOrderData.vendor.phone : ""
            }</p>
            <p><strong>Fax: </strong>${
              jobOrderData.vendor.fax ? jobOrderData.vendor.fax : ""
            }</p>
          </div>
          </div>

          <div class="section-1-right">
            <h1>Job Order # ${jobOrderData.jobOrderNo}</h1>
            <h3>${createdAt}</h3>
          </div>
        </div>
        <hr/>
      <div class="section-2">
        <div class='section-2-left'>
          <div>
            <h3>Delivery Address</h3>
            <p>${jobOrderData.streetAddress}</p>
            <p>${jobOrderData.city} ${jobOrderData.state} ${
    jobOrderData.zip
  }</p>
          </div>
          <div>
          <h3>Instructions</h3>
          <p>${jobOrderData.instructions ? jobOrderData.instructions : ""}</p>
        </div>
        <div>
          <h3>Onsite Contact Person Details</h3>
          <p><strong>Name: </strong> ${
            jobOrderData.contactPersonName ? jobOrderData.contactPersonName : ""
          } </p>
          <p><strong>Phone: </strong> ${
            jobOrderData.contactPersonPhone
              ? jobOrderData.contactPersonPhone
              : ""
          }</p>
        </div>
        </div>

        <div class='section-2-right'>
          <div>
            <h3>Delivery Date</h3>
            <p>${jobOrderData.deliveryDate ? deliveryDate : ""}</p>
          </div>
          <div>
            <h3>Pickup Date</h3>
            <p>${jobOrderData.pickupDate ? pickupDate : ""}</p>
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
          <h4>Total Amount $${totalAmount(jobOrderData.products)}</h4>
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

      </footer>
    </body>
  </html>
`;
};

export default htmlTemplate;
