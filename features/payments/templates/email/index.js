import { flushjohn } from "../../../../constants/index.js";

/**
 * Sales Receipt Email Template (HTML)
 * Sent after successful payment
 */
const template = (paymentData) => {
  const { email_signature } = flushjohn;
  const { salesOrder, amount, createdAt, paymentMethod, cardLast4, cardBrand } = paymentData;

  const paymentMethodDisplay = 
    paymentMethod === "payment_link"
      ? "Payment Link"
      : paymentMethod === "saved_card"
      ? `Saved Card${cardLast4 ? ` (•••• ${cardLast4})` : ""}`
      : `Card Payment${cardLast4 ? ` (•••• ${cardLast4})` : ""}`;

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

  const customerName = salesOrder?.lead?.fName && salesOrder?.lead?.lName
    ? `${salesOrder.lead.fName} ${salesOrder.lead.lName}`
    : salesOrder?.lead?.fName || "Customer";

  const companyName = salesOrder?.lead?.cName || "";

  // Build products table
  const productsHtml = salesOrder?.products?.map(product => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${product.item || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${product.quantity || 0}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(product.rate || 0).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${((product.quantity || 0) * (product.rate || 0)).toFixed(2)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="padding: 12px; text-align: center;">No items</td></tr>';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Payment Receipt</h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">Thank you for your payment!</p>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="display: inline-block; background-color: #d1fae5; color: #065f46; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 14px;">
                ✓ Payment Successful
              </div>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                <strong>Hi ${customerName},</strong>
              </p>
              ${companyName ? `<p style="margin: 5px 0 0; font-size: 14px; color: #6b7280;">${companyName}</p>` : ''}
            </td>
          </tr>

          <!-- Payment Details Card -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Sales Order #</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${salesOrder?.salesOrderNo || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Date</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${paymentDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${paymentMethodDisplay}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 15px 0 8px; border-top: 2px solid #e5e7eb;">
                          <table width="100%">
                            <tr>
                              <td style="color: #111827; font-size: 18px; font-weight: 700;">Amount Paid</td>
                              <td style="color: #059669; font-size: 24px; font-weight: 700; text-align: right;">$${amount.toFixed(2)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items -->
          ${salesOrder?.products?.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px;">
              <h2 style="margin: 0 0 15px; font-size: 18px; color: #111827; font-weight: 600;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Item</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Rate</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Message -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Your payment has been successfully processed and your order is being prepared. If you have any questions about this payment or your order, please don't hesitate to reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #111827; font-weight: 600;">${flushjohn.cName}</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                ${flushjohn.phone ? `Phone: ${flushjohn.phone}<br>` : ''}
                ${flushjohn.email ? `Email: ${flushjohn.email}<br>` : ''}
                ${flushjohn.address ? `${flushjohn.address}` : ''}
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
