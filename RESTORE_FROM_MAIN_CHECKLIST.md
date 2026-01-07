# Restore from Main Branch - Complete Checklist

## ✅ FIXED ITEMS (Already Restored)

### 1. Constants File (`constants.js`)
**Status**: ✅ **CREATED**
**Location**: `/Users/nishantkumar/dev/flushjohn-api/constants.js`

**Exports**:
- ✅ `flushjohn` - FlushJohn company info (cName, email, phone, phone_link, homepage, address, email_signature)
- ✅ `quengenesis` - QuenGenesis company info (cName, email, phone, homepage, email_signature)
- ✅ `s3assets` - S3/CloudFront assets URL
- ✅ `localAssetsUrl` - Local assets URL for logos
- ✅ `apiBaseUrls` - API base URLs (CRM_BASE_URL, API_BASE_URL, WEB_BASE_URL)

### 2. CSRF Token Handling
**Status**: ✅ **FIXED**
- Consistent session ID resolution in CSRF middleware
- CSRF tokens included in login/verify responses
- CRM captures CSRF tokens from responses

### 3. PDF Generation Error Handling
**Status**: ✅ **IMPROVED**
- Better error logging in PDF generation routes
- More descriptive error messages

## 📋 ENVIRONMENT VARIABLES FROM .env.backup

Copy these from `.env.backup` to your `.env` file:

### Critical (Required for Core Functionality)
```bash
# Database
MONGO_DB_URI=mongodb+srv://...

# Authentication
SECRET_KEY=...

# FlushJohn Email
NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID=support@flushjohn.com
FLUSH_JOHN_EMAIL_PASSWORD=...

# QuenGenesis Email
NEXT_PUBLIC_QUENGENESIS_EMAIL_ID=contact@quengenesis.com
QUENGENESIS_EMAIL_PASSWORD=...

# AWS (Required for PDF/File uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=flushjohn-assets

# CDN/Assets
CLOUDFRONT_URL=https://cdn.flushjohn.com
NEXT_PUBLIC_CLOUD_FRONT_URL=https://d1a2b3c4d5e6f7g8.cloudfront.net

# CORS
ORIGINS=http://localhost:3000,http://localhost:3001,https://www.flushjohn.com,https://crm.flushjohn.com

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_SUCCESS_URL=https://flushjohn.com/payment/success

# OpenAI
OPENAI_API_KEY=sk-...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_RECIPIENT_NUMBER=+919002785683

# Phone.com
PHONE_COM_API_TOKEN=...
PHONE_COM_ACCOUNT_ID=...
PHONE_COM_API_BASE_URL=https://api.phone.com/v4

# Google Cloud Speech
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}

# Server
PORT=8080
API_BASE_URL=http://localhost:8080
NODE_ENV=development
```

### Optional (Has Defaults)
```bash
# FlushJohn Optional
FLUSH_JOHN_PHONE=(713) 555-5555
FLUSH_JOHN_PHONE_LINK=tel:+17135555555
FLUSH_JOHN_HOMEPAGE=https://www.flushjohn.com
FLUSH_JOHN_ADDRESS=Houston, TX
FLUSH_JOHN_EMAIL_SIGNATURE=...

# QuenGenesis Optional
QUENGENESIS_PHONE=...
QUENGENESIS_HOMEPAGE=...
QUENGENESIS_EMAIL_SIGNATURE=...

# Audio Capture (Sales Assist)
SYSTEM_AUDIO_DEVICE="BlackHole 16ch"
AGGREGATE_AUDIO_DEVICE="Aggregate Device"
USE_BACKEND_AUDIO_CAPTURE=true

# Other
UNSPLASH_ACCESS_KEY=...
CDN_URL=...
LOCAL_ASSETS_URL=...
CRM_BASE_URL=...
WEB_BASE_URL=...
```

## 📁 TEMPLATE FILES STATUS

### PDF Templates - ✅ All Present
- ✅ `features/quotes/templates/pdf.js`
- ✅ `features/quotes/templates/pdf/styles.ts`
- ✅ `features/salesOrders/templates/pdf.js`
- ✅ `features/salesOrders/templates/pdf/styles.ts`
- ✅ `features/jobOrders/templates/pdf.js`
- ✅ `features/jobOrders/templates/pdf/styles.ts`

### Email Templates - ✅ All Present
- ✅ `features/quotes/templates/email.js`
- ✅ `features/salesOrders/templates/email.js`
- ✅ `features/salesOrders/templates/invoice.js`
- ✅ `features/jobOrders/templates/email.js`
- ✅ `features/payments/templates/email.js`

## 🔍 VERIFICATION CHECKLIST

### Step 1: Verify Constants File
```bash
cd /Users/nishantkumar/dev/flushjohn-api
node -e "import('./constants.js').then(m => console.log('Exports:', Object.keys(m)))"
```
**Expected Output**: `Exports: apiBaseUrls, flushjohn, localAssetsUrl, quengenesis, s3assets`

### Step 2: Check Environment Variables
```bash
# Compare your .env with .env.backup
diff <(sort .env) <(sort .env.backup) | grep "^>" | head -20
```

### Step 3: Test PDF Generation
- Try generating a quote PDF
- Try generating a sales order PDF  
- Try generating a job order PDF

### Step 4: Test Email Sending
- Try sending a quote email
- Try sending a sales order email
- Try sending a job order email
- Try sending a payment receipt

### Step 5: Verify Logos Exist
```bash
ls -la public/logos/
```
**Expected Files**:
- ✅ `flush_john_logo_black.svg`
- ✅ `logo_quengenesis.svg`

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot find module constants.js"
**Fix**: ✅ Already created at `/Users/nishantkumar/dev/flushjohn-api/constants.js`

### Issue: "CSRF token validation failed"
**Fix**: ✅ Already fixed - ensure you:
1. Make a GET request first to get CSRF token
2. Include `X-Session-ID` header in all requests
3. Include `X-CSRF-Token` header in POST/PUT/DELETE requests

### Issue: "PDF generation failed"
**Fix**: 
1. ✅ Constants file created
2. Ensure Playwright browsers are installed: `npx playwright install chromium`
3. Check AWS credentials are set
4. Check S3 bucket exists and is accessible

### Issue: "Email sending failed"
**Fix**:
1. Ensure email credentials are set in `.env`
2. Check SMTP settings (Zoho for FlushJohn, configured in emailService.ts)

## 📝 SUMMARY

### ✅ Completed
1. Created `constants.js` with all required exports
2. Fixed CSRF token handling for consistent session IDs
3. Improved PDF generation error handling
4. Verified all template files exist
5. Verified logo files exist
6. Created comprehensive checklist

### ⚠️ Action Required

### 1. Copy Missing Environment Variables
Run the check script to see what's missing:
```bash
node scripts/check-env-vars.js
```

**Missing Variables Found** (9):
- `WHATSAPP_ENABLED` - Enable WhatsApp notifications
- `WHATSAPP_RECIPIENT_NUMBER` - WhatsApp recipient number
- `NEXT_PUBLIC_CLOUD_FRONT_URL` - Public CloudFront URL
- `USE_S3_STORAGE` - Enable S3 storage
- `PHONE_COM_API_TOKEN` - Phone.com API token
- `PHONE_COM_ACCOUNT_ID` - Phone.com account ID
- `PHONE_COM_API_BASE_URL` - Phone.com API base URL
- `PHONE_COM_WEBHOOK_URL` - Phone.com webhook URL
- `PHONE_COM_WEBHOOK_SECRET` - Phone.com webhook secret

**Copy these from `.env.backup` to your `.env` file:**
```bash
# Quick copy (be careful - this will append, not replace)
grep -E "^(WHATSAPP_|NEXT_PUBLIC_CLOUD_FRONT_URL|USE_S3_STORAGE|PHONE_COM_)" .env.backup >> .env
```

2. **Restart the API server** after updating `.env`
   ```bash
   # If using tsx watch, it should auto-reload
   # Otherwise restart manually
   ```

3. **Test all functionality**
   - PDF generation (quotes, sales orders, job orders)
   - Email sending (all types)
   - Payment processing
   - File uploads

## 🔗 RELATED FILES

- Constants: `/Users/nishantkumar/dev/flushjohn-api/constants.js`
- Environment Backup: `/Users/nishantkumar/dev/flushjohn-api/.env.backup`
- This Checklist: `/Users/nishantkumar/dev/flushjohn-api/RESTORE_FROM_MAIN_CHECKLIST.md`

