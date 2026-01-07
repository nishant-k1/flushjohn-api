# Missing Items Checklist - Post Restructure Merge

## ✅ FIXED ITEMS

### 1. Constants File (`constants.js`)

- **Status**: ✅ CREATED
- **Location**: `/Users/nishantkumar/dev/flushjohn-api/constants.js`
- **Contains**:
  - `flushjohn` - Company information (cName, email, phone, homepage, address, email_signature)
  - `quengenesis` - Company information (cName, email, phone, homepage, email_signature)
  - `s3assets` - S3/CloudFront URL for assets
  - `localAssetsUrl` - Local assets URL for logos
  - `apiBaseUrls` - API base URLs (CRM_BASE_URL, API_BASE_URL, WEB_BASE_URL)

### 2. CSRF Token Handling

- **Status**: ✅ FIXED
- **Files Updated**:
  - `/Users/nishantkumar/dev/flushjohn-api/middleware/csrf.ts` - Consistent session ID resolution
  - `/Users/nishantkumar/dev/flushjohn-api/features/auth/routes/auth.ts` - CSRF token in login/verify responses
  - `/Users/nishantkumar/dev/flushjohn-crm/src/auth/authService.ts` - Capture CSRF tokens from responses

## 📋 ENVIRONMENT VARIABLES CHECKLIST

Based on `.env.backup`, ensure these are set in your `.env` file:

### Required Environment Variables:

#### Database

- ✅ `MONGO_DB_URI` - MongoDB connection string

#### FlushJohn Email Credentials

- ✅ `NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID` - Email address (e.g., support@flushjohn.com)
- ✅ `FLUSH_JOHN_EMAIL_PASSWORD` - Email password
- `FLUSH_JOHN_PHONE` - Phone number (optional, has default)
- `FLUSH_JOHN_PHONE_LINK` - Phone link (optional, has default)
- `FLUSH_JOHN_HOMEPAGE` - Homepage URL (optional, has default)
- `FLUSH_JOHN_ADDRESS` - Company address (optional, has default)
- `FLUSH_JOHN_EMAIL_SIGNATURE` - Email signature (optional, has default)

#### QuenGenesis Email Credentials

- ✅ `NEXT_PUBLIC_QUENGENESIS_EMAIL_ID` - Email address (e.g., contact@quengenesis.com)
- ✅ `QUENGENESIS_EMAIL_PASSWORD` - Email password
- `QUENGENESIS_PHONE` - Phone number (optional)
- `QUENGENESIS_HOMEPAGE` - Homepage URL (optional)
- `QUENGENESIS_EMAIL_SIGNATURE` - Email signature (optional)

#### AWS Configuration

- ✅ `AWS_ACCESS_KEY_ID` - AWS access key
- ✅ `AWS_SECRET_ACCESS_KEY` - AWS secret key
- ✅ `AWS_REGION` - AWS region (e.g., us-east-1)
- ✅ `AWS_S3_BUCKET_NAME` - S3 bucket name (e.g., flushjohn-assets)

#### CDN/Assets

- ✅ `CLOUDFRONT_URL` - CloudFront CDN URL (e.g., https://cdn.flushjohn.com)
- `CDN_URL` - Alternative CDN URL
- `NEXT_PUBLIC_CLOUD_FRONT_URL` - Public CloudFront URL
- `LOCAL_ASSETS_URL` - Local assets URL (optional)

#### CORS

- ✅ `ORIGINS` - Allowed origins (comma-separated)

#### Authentication

- ✅ `SECRET_KEY` - JWT secret key

#### Stripe (Payments)

- ✅ `STRIPE_SECRET_KEY` - Stripe secret key (test or live)
- ✅ `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- ✅ `PAYMENT_SUCCESS_URL` - Payment success redirect URL

#### OpenAI

- ✅ `OPENAI_API_KEY` - OpenAI API key for AI features

#### Telegram

- ✅ `TELEGRAM_BOT_TOKEN` - Telegram bot token
- ✅ `TELEGRAM_CHAT_ID` - Telegram chat ID

#### WhatsApp

- ✅ `WHATSAPP_ENABLED` - Enable WhatsApp (true/false)
- ✅ `WHATSAPP_RECIPIENT_NUMBER` - WhatsApp recipient number

#### Phone.com

- ✅ `PHONE_COM_API_TOKEN` - Phone.com API token
- ✅ `PHONE_COM_ACCOUNT_ID` - Phone.com account ID
- ✅ `PHONE_COM_API_BASE_URL` - Phone.com API base URL
- `PHONE_COM_WEBHOOK_URL` - Phone.com webhook URL
- `PHONE_COM_WEBHOOK_SECRET` - Phone.com webhook secret

#### Google Cloud (Speech Recognition)

- ✅ `GOOGLE_CREDENTIALS_JSON` - Google service account credentials (JSON string)

#### Audio Capture (for Sales Assist)

- `SYSTEM_AUDIO_DEVICE` - System audio device name (e.g., "BlackHole 16ch")
- `AGGREGATE_AUDIO_DEVICE` - Aggregate device name
- `OPERATOR_AUDIO_CHANNEL` - Operator audio channel (default: 1)
- `CUSTOMER_AUDIO_CHANNEL` - Customer audio channel (default: 2)
- `USE_BACKEND_AUDIO_CAPTURE` - Enable backend audio capture (true/false)

#### API URLs

- ✅ `API_BASE_URL` - API base URL (default: http://localhost:8080)
- `CRM_BASE_URL` - CRM base URL (optional)
- `WEB_BASE_URL` - Web base URL (optional)

#### Server

- ✅ `PORT` - Server port (default: 8080)
- ✅ `NODE_ENV` - Environment (development/production)

#### Other

- `UNSPLASH_ACCESS_KEY` - Unsplash API key (optional)

## 📁 TEMPLATE FILES CHECKLIST

### PDF Templates

- ✅ `features/quotes/templates/pdf.js` - Quote PDF template
- ✅ `features/quotes/templates/pdf/styles.ts` - Quote PDF styles
- ✅ `features/salesOrders/templates/pdf.js` - Sales Order PDF template
- ✅ `features/salesOrders/templates/pdf/styles.ts` - Sales Order PDF styles
- ✅ `features/jobOrders/templates/pdf.js` - Job Order PDF template
- ✅ `features/jobOrders/templates/pdf/styles.ts` - Job Order PDF styles

### Email Templates

- ✅ `features/quotes/templates/email.js` - Quote email template
- ✅ `features/salesOrders/templates/email.js` - Sales Order email template
- ✅ `features/salesOrders/templates/invoice.js` - Invoice email template
- ✅ `features/jobOrders/templates/email.js` - Job Order email template
- ✅ `features/payments/templates/email.js` - Payment receipt email template

## 🔍 VERIFICATION STEPS

1. **Check constants.js exists and exports all required values**

   ```bash
   node -e "import('./constants.js').then(m => console.log(Object.keys(m)))"
   ```

2. **Verify all templates can import constants**

   - All PDF templates import: `flushjohn`, `s3assets`, `localAssetsUrl`
   - Job Order PDF also imports: `quengenesis`, `apiBaseUrls`
   - All email templates import: `flushjohn` or `quengenesis`

3. **Check environment variables**

   - Compare your `.env` file with `.env.backup`
   - Ensure all required variables are set

4. **Test PDF generation**

   - Try generating a quote PDF
   - Try generating a sales order PDF
   - Try generating a job order PDF

5. **Test email sending**
   - Try sending a quote email
   - Try sending a sales order email
   - Try sending a job order email
   - Try sending a payment receipt

## 📝 NOTES

- The `constants.js` file was missing and has been created
- All templates are importing from `constants.js` correctly
- Environment variables should be set from `.env.backup`
- CSRF token handling has been fixed for consistent session ID resolution

## 🔧 ADDITIONAL ENVIRONMENT VARIABLES NEEDED

From `.env.backup`, these variables are also present but may need to be added to your `.env`:

- `AWS_S3_BUCKET_NAME` - S3 bucket name (e.g., flushjohn-assets) - **REQUIRED for PDF/asset uploads**
- `USE_S3_STORAGE` - Enable S3 storage (true/false)
- `NEXT_PUBLIC_CLOUD_FRONT_URL` - Public CloudFront URL
- `PDF_CLEANUP_ON_STARTUP` - Cleanup PDFs on startup (optional)
- `PDF_CLEANUP_SCHEDULE` - PDF cleanup schedule (optional)
- `PDF_MAX_AGE_DAYS` - Maximum age for PDFs (optional)
- `AUTO_PDF_CLEANUP` - Auto cleanup PDFs (optional)
- `TIMEZONE` - Server timezone (optional)

## ✅ VERIFICATION COMPLETE

All required files and configurations have been checked and restored:

- ✅ `constants.js` created with all required exports
- ✅ All template files exist and can import constants
- ✅ Environment variables documented
- ✅ CSRF token handling fixed
- ✅ Logo files exist in `public/logos/`
