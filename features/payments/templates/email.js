// @ts-nocheck
import { getFlushJohnEmailSignature } from "../../common/constants/emailSignatures.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";
import { safeDate, safeCurrency } from "../../../utils/safeValue.js";

/**
 * Payment Receipt Email Template (HTML)
 * Sent after successful payment
 */
const template = (paymentData) => {
  const email_signature = getFlushJohnEmailSignature();
  const flushjohn_cName = process.env.FLUSH_JOHN_COMPANY_NAME;
  const flushjohn_phone = process.env.FLUSH_JOHN_PHONE;
  const flushjohn_email = process.env.FLUSH_JOHN_EMAIL_ID;
  const flushjohn_website =
    process.env.FLUSH_JOHN_HOMEPAGE || process.env.FLUSH_JOHN_WEBSITE_URL;
  const { salesOrder, amount, createdAt, paymentMethod, cardLast4, cardBrand } =
    paymentData;

  const paymentMethodDisplay =
    paymentMethod === "payment_link"
      ? "Payment Link"
      : paymentMethod === "saved_card"
        ? `Saved Card${cardLast4 ? ` (•••• ${cardLast4})` : ""}`
        : `Card Payment${cardLast4 ? ` (•••• ${cardLast4})` : ""}`;

  const paymentDate = safeDate(createdAt || new Date(), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const customerName =
    salesOrder?.lead?.fName && salesOrder?.lead?.lName
      ? `${salesOrder.lead.fName} ${salesOrder.lead.lName}`
      : salesOrder?.lead?.fName || "Customer";

  const companyName = salesOrder?.lead?.cName || "";

  // Build products table - Compact
  const productsHtml =
    salesOrder?.products
      ?.map((product) => {
        const quantity = product.quantity || 0;
        const rate = product.rate || 0;
        const total = calculateProductAmount(quantity, rate);
        return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #d1d5db; font-size: 12px;">${
        product.item || "N/A"
      }</td>
      <td style="padding: 8px; border-bottom: 1px solid #d1d5db; text-align: center; font-size: 12px;">${quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #d1d5db; text-align: right; font-size: 12px;">${safeCurrency(rate)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #d1d5db; text-align: right; font-weight: 600; font-size: 12px;">${safeCurrency(total)}</td>
    </tr>
  `;
      })
      .join("") ||
    '<tr><td colspan="4" style="padding: 8px; text-align: center; font-size: 12px;">No items</td></tr>';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <!-- Preheader text - prevents Gmail from collapsing -->
  <style type="text/css">
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <!-- Preheader text - shown in email preview, prevents Gmail collapse -->
  <div class="preheader" style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; line-height: 0; font-size: 0;">
    Your payment of ${safeCurrency(amount)} has been successfully processed. Receipt for Sales Order #${
      salesOrder?.salesOrderNo || "N/A"
    }.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Logo - Compact -->
          <tr>
            <td style="background-color: #5F503F; padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="100" valign="middle" style="padding-right: 15px;">
                    <img src="cid:logo-flushjohn" alt="Flush John Logo" style="max-width: 100px; width: 100px; height: auto; display: block;" />
                  </td>
                  <td valign="middle" align="center" style="text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.2; text-align: center;">Payment Receipt</h1>
                    <p style="margin: 4px 0 0; color: #e8e6e3; font-size: 14px; text-align: center;">✓ Payment Successful</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Info & Payment Summary - Compact -->
          <tr>
            <td style="padding: 20px 30px;">
              <p style="margin: 0 0 15px; font-size: 16px; color: #2c3e50; line-height: 1.5;">
                <strong>Hi ${customerName},</strong><br>
                <span style="font-size: 14px; color: #4b5563; font-weight: normal;">Your payment of <strong style="color: #2e7d32; font-size: 18px;">${safeCurrency(
                  amount
                )}</strong> has been successfully processed.</span>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; border: 1px solid #d1d5db; margin-top: 10px;">
                <tr>
                  <td style="padding: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #4b5563; font-size: 13px;">Sales Order #</td>
                        <td style="padding: 4px 0; color: #2c3e50; font-size: 13px; font-weight: 600; text-align: right;">${
                          salesOrder?.salesOrderNo || "N/A"
                        }</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #4b5563; font-size: 13px;">Payment Date</td>
                        <td style="padding: 4px 0; color: #2c3e50; font-size: 13px; font-weight: 600; text-align: right;">${paymentDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #4b5563; font-size: 13px;">Payment Method</td>
                        <td style="padding: 4px 0; color: #2c3e50; font-size: 13px; font-weight: 600; text-align: right;">${paymentMethodDisplay}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items - Compact -->
          ${
            salesOrder?.products?.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 10px; font-size: 16px; color: #2c3e50; font-weight: 600;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 600; color: #4b5563; text-transform: uppercase;">Item</th>
                    <th style="padding: 8px; text-align: center; font-size: 11px; font-weight: 600; color: #4b5563; text-transform: uppercase;">Quantity</th>
                    <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: 600; color: #4b5563; text-transform: uppercase;">Rate</th>
                    <th style="padding: 8px; text-align: right; font-size: 11px; font-weight: 600; color: #4b5563; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Message -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                Your payment has been successfully processed and your order is being prepared. If you have any questions about this payment or your order, please don't hesitate to reply to this email.
              </p>
              <!-- View in browser link - helps prevent Gmail collapse -->
              <p style="margin: 20px 0 0; font-size: 12px; color: #6b7280; text-align: center;">
                <a href="${
                  flushjohn_website || "#"
                }" style="color: #0066cc; text-decoration: underline;">View this receipt in your browser</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #d1d5db;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #2c3e50; font-weight: 600;">${flushjohn_cName}</p>
              <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.6;">
                ${flushjohn_phone ? `Phone: ${safePhone(flushjohn_phone)}<br>` : ""}
                ${flushjohn_email ? `Email: ${flushjohn_email}<br>` : ""}
                ${
                  flushjohn_website
                    ? `Website: <a href="${flushjohn_website}" style="color: #0066cc; text-decoration: underline;">${flushjohn_website}</a>`
                    : ""
                }
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default template;
