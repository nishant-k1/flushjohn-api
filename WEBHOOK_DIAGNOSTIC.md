# Stripe Webhook Diagnostic Report

## Webhook Configuration Status

### ✅ Configuration Check

1. **Webhook Secret**: ✅ Configured (`STRIPE_WEBHOOK_SECRET` is set)
2. **Webhook Route**: ✅ Configured at `/payments/webhook`
3. **Raw Body Parsing**: ✅ Correctly configured (before JSON middleware)
4. **CSRF Protection**: ✅ Webhook endpoint is excluded from CSRF

### 📍 Webhook Endpoint

**Local Development:**

- URL: `http://localhost:8080/payments/webhook`
- Method: `POST`
- Content-Type: `application/json` (raw body)

**Production:**

- URL: `https://[YOUR_DOMAIN]/payments/webhook`
- Method: `POST`
- Content-Type: `application/json` (raw body)

### 🔍 How to Verify Webhook is Working

#### 1. Check Server Logs

After a payment, look for these log messages:

```
🔔 [requestId] Webhook received at [timestamp]
✅ [requestId] Webhook signature verified. Event type: [type], ID: [id]
🔄 [requestId] Processing webhook event: [type]
📥 Processing Stripe webhook: [type] (ID: [id])
✅ [requestId] Webhook event processed successfully
```

#### 2. Check Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Find your webhook endpoint
3. Check the "Events" tab for recent deliveries
4. Look for:
   - ✅ Green checkmarks (successful deliveries)
   - ❌ Red X marks (failed deliveries)
   - Click on failed events to see error details

#### 3. Test Webhook Locally (Using Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8080/payments/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

#### 4. Check Database for Receipt Status

```javascript
// Check if receipts are being sent automatically
db.payments
  .find({
    status: "succeeded",
    receiptSent: true,
  })
  .sort({ createdAt: -1 })
  .limit(10);
```

### 🐛 Common Issues

#### Issue 1: Webhook Not Receiving Events

**Symptoms:**

- No webhook logs in server
- Stripe dashboard shows "No recent events"

**Possible Causes:**

1. Webhook endpoint not configured in Stripe Dashboard
2. Wrong URL in Stripe Dashboard
3. Server not accessible from internet (for production)
4. Firewall blocking Stripe IPs

**Solution:**

1. Verify webhook URL in Stripe Dashboard matches your server
2. For local development, use Stripe CLI or ngrok
3. For production, ensure server is publicly accessible
4. Check firewall rules allow Stripe IPs: https://stripe.com/docs/ips

#### Issue 2: Signature Verification Failed

**Symptoms:**

- Log shows: `❌ Webhook signature verification failed`
- Error: `No signatures found matching the expected signature`

**Possible Causes:**

1. Wrong `STRIPE_WEBHOOK_SECRET` in environment
2. Webhook secret changed in Stripe but not updated in `.env`
3. Request body modified before signature verification

**Solution:**

1. Get the correct webhook secret from Stripe Dashboard:
   - Go to Webhooks → Your endpoint → "Signing secret"
   - Copy the secret (starts with `whsec_`)
2. Update `.env` file with correct secret
3. Restart server

#### Issue 3: Webhook Receives Events But Payment Not Updated

**Symptoms:**

- Webhook logs show successful processing
- But payment status remains "pending" in database

**Possible Causes:**

1. Payment not found by webhook handler
2. Payment already succeeded (duplicate prevention)
3. Database update failed silently

**Solution:**

1. Check webhook logs for: `📥 Processing Stripe webhook: checkout.session.completed`
2. Verify payment exists in database with matching `salesOrderId` or `paymentLinkId`
3. Check if payment status is already "succeeded" (webhook skips duplicates)

#### Issue 4: Receipt Not Sent Automatically

**Symptoms:**

- Payment succeeds but no receipt email sent
- `receiptSent` field is `false` in database

**Possible Causes:**

1. Webhook not firing
2. Email sending failed (check email service logs)
3. `sendReceiptAndMarkSent` function error

**Solution:**

1. Check webhook logs for receipt sending attempts
2. Check email service configuration
3. Verify `sendReceiptAndMarkSent` is being called in webhook handler

### 📊 Webhook Events Handled

The webhook handles these Stripe events:

1. **`checkout.session.completed`**

   - Triggered when payment link is paid
   - Updates payment status to "succeeded"
   - Sends receipt email automatically

2. **`payment_intent.succeeded`**

   - Triggered when card payment succeeds
   - Updates payment status to "succeeded"
   - Sends receipt email automatically

3. **`payment_intent.payment_failed`**

   - Triggered when payment fails
   - Updates payment status to "failed"

4. **`charge.refunded`**
   - Triggered when charge is refunded
   - Updates payment status to "refunded" or "partially_refunded"

### 🔧 Testing Webhook Manually

#### Test Webhook Endpoint Accessibility

```bash
# Test if endpoint is accessible (should return error without proper signature)
curl -X POST http://localhost:8080/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Expected response: `Webhook Error: No signatures found matching the expected signature`

#### Test with Stripe CLI

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:8080/payments/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
```

### 📝 Next Steps

1. **Check Stripe Dashboard** for webhook delivery status
2. **Monitor server logs** during a test payment
3. **Verify receipt emails** are being sent automatically
4. **Check database** for `receiptSent` flag updates

### 🔗 Useful Links

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Stripe IP Addresses](https://stripe.com/docs/ips)
