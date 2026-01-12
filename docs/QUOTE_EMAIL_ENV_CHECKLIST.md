# Quote Email Environment Variables Checklist

This document lists all environment variables required for the quote email functionality to work in production.

## 🔴 CRITICAL - Required for Email Sending

These must be set, otherwise email sending will fail:

1. **`FLUSH_JOHN_EMAIL_ID`** - Email address used to send quote emails
2. **`FLUSH_JOHN_EMAIL_PASSWORD`** - Password for the email account
3. **`FLUSH_JOHN_COMPANY_NAME`** - Company name used in email subject and templates

## 🔴 CRITICAL - Required for PDF Generation & Storage

These must be set, otherwise PDF generation/upload will fail:

4. **`AWS_ACCESS_KEY_ID`** - AWS access key for S3 uploads
5. **`AWS_SECRET_ACCESS_KEY`** - AWS secret key for S3 uploads
6. **`AWS_S3_BUCKET_NAME`** - S3 bucket name where PDFs are stored
7. **`AWS_REGION`** - AWS region (e.g., `us-east-1`, `us-west-2`)

## 🟡 OPTIONAL - Recommended for Production

These improve functionality but are not strictly required:

8. **`CLOUDFRONT_URL`** - CloudFront CDN URL (if using CloudFront for PDF delivery)
   - If not set, direct S3 URLs will be used
   - Example: `https://cdn.flushjohn.com`

9. **`FLUSH_JOHN_PHONE`** - Phone number (used in PDF templates)
10. **`FLUSH_JOHN_PHONE_LINK`** - Phone number in link format (used in PDF templates)
11. **`FLUSH_JOHN_HOMEPAGE`** - Website URL (used in PDF templates)

## 🔍 How to Verify in Production

### Option 1: Check Deployment Platform Environment Variables
- **Vercel**: Settings → Environment Variables
- **Heroku**: Settings → Config Vars
- **AWS/Docker**: Check your deployment configuration

### Option 2: Add a Health Check Endpoint (Recommended)

You can add this endpoint to verify environment variables are set:

```typescript
// In your routes file
router.get("/health/email-config", (req, res) => {
  const required = {
    FLUSH_JOHN_EMAIL_ID: !!process.env.FLUSH_JOHN_EMAIL_ID,
    FLUSH_JOHN_EMAIL_PASSWORD: !!process.env.FLUSH_JOHN_EMAIL_PASSWORD,
    FLUSH_JOHN_COMPANY_NAME: !!process.env.FLUSH_JOHN_COMPANY_NAME,
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: !!process.env.AWS_S3_BUCKET_NAME,
    AWS_REGION: !!process.env.AWS_REGION,
  };

  const missing = Object.entries(required)
    .filter(([_, exists]) => !exists)
    .map(([key]) => key);

  if (missing.length > 0) {
    return res.status(500).json({
      success: false,
      message: "Missing required environment variables",
      missing: missing,
    });
  }

  res.status(200).json({
    success: true,
    message: "All required environment variables are set",
    config: Object.keys(required),
  });
});
```

### Option 3: Check Server Logs

After deploying the improved error handling, the error response will now tell you exactly which variable is missing:

- `"Missing required environment variable: FLUSH_JOHN_EMAIL_ID"`
- `"Missing AWS credentials. Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."`
- etc.

## 🚨 Common Issues

1. **Environment variables not set in production** - Most common issue
2. **Variable names with typos** - Check exact spelling (case-sensitive)
3. **Variables set in wrong environment** - Make sure they're set for "Production" not just "Development"
4. **Variables not accessible at runtime** - Some platforms require redeployment after adding env vars

## ✅ Quick Test

After setting all variables, test the quote email endpoint. The new error handling will show:
- ✅ Success: Email sent successfully
- ❌ Clear error message: Exactly which variable is missing or what failed
