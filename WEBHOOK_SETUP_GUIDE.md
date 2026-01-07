# Stripe Webhook Setup Guide

## Quick Answer: When Do You Need `stripe listen`?

### 🔵 Local Development (localhost)

**YES** - You need to run it **while testing webhooks locally**

- Run it in a separate terminal window
- Keep it running while you test payments
- Stop it when you're done testing
- **Why?** Stripe can't reach `localhost:8080` from the internet, so Stripe CLI acts as a bridge

### 🔴 Production

**NO** - You don't need to run it

- Configure webhook URL once in Stripe Dashboard
- Stripe sends webhooks directly to your production server
- Works automatically after initial setup

---

## Detailed Setup

### Local Development Workflow

1. **Start your API server:**

   ```bash
   npm run dev
   ```

2. **In a separate terminal, start webhook forwarding:**

   ```bash
   stripe listen --forward-to localhost:8080/payments/webhook
   ```

3. **Copy the webhook signing secret** (starts with `whsec_`) from the CLI output

4. **Update your `.env` file:**

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Restart your API server** (if it was already running)

6. **Test webhooks:**
   ```bash
   # In another terminal
   stripe trigger checkout.session.completed
   ```

### Production Setup

1. **Go to Stripe Dashboard:**

   - Navigate to: [Developers → Webhooks](https://dashboard.stripe.com/webhooks)

2. **Add endpoint:**

   - Click "Add endpoint"
   - Enter your production URL: `https://api.flushjohn.com/payments/webhook`
   - Select events to listen to:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`

3. **Copy the signing secret:**

   - Click on your webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

4. **Update production environment variables:**

   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Done!** Webhooks will now work automatically in production.

---

## Tips & Tricks

### Run in Background (Optional)

You can run `stripe listen` in the background:

```bash
# Using nohup
nohup stripe listen --forward-to localhost:8080/payments/webhook > stripe-webhook.log 2>&1 &

# Or using a process manager like PM2
pm2 start "stripe listen --forward-to localhost:8080/payments/webhook" --name stripe-webhook
```

### Check if Webhook Forwarding is Running

```bash
ps aux | grep "stripe.*listen" | grep -v grep
```

### Stop Webhook Forwarding

```bash
# If running in foreground: Press Ctrl+C
# If running in background: Find and kill the process
pkill -f "stripe listen"
```

### Use Helper Script

```bash
./scripts/setup-stripe-webhook.sh
```

---

## Common Questions

### Q: Do I need to run it every time I start my dev server?

**A:** Only if you're testing webhooks. If you're just working on other features, you don't need it.

### Q: Can I automate this?

**A:** Yes! You can:

- Use a process manager (PM2, supervisor)
- Create a script that starts both your server and webhook forwarding
- Use Docker Compose to run both services

### Q: What if I forget to run it?

**A:** Webhooks won't reach your local server. You'll see:

- No webhook logs in your server
- Payments succeed but receipts aren't sent automatically
- Payment status might not update

### Q: Can I use the same webhook secret for local and production?

**A:** No! Each environment has its own secret:

- **Local:** Secret from `stripe listen` (changes each time)
- **Production:** Secret from Stripe Dashboard (stays the same)

---

## Troubleshooting

### Webhook not reaching local server

- ✅ Check if `stripe listen` is running
- ✅ Verify webhook secret in `.env` matches CLI output
- ✅ Ensure API server is running on port 8080
- ✅ Check server logs for webhook errors

### Webhook secret mismatch

- Get the latest secret from `stripe listen` output
- Update `.env` file
- Restart API server

### Production webhooks not working

- Verify webhook URL in Stripe Dashboard
- Check webhook secret in production environment
- Review Stripe Dashboard → Webhooks → Events for delivery status
- Check server logs for errors
