# Missing Environment Variables

## ❌ Variables Currently Using Default/Empty Values

### FlushJohn Company Information
1. **FLUSH_JOHN_PHONE** 
   - Current: Using default `"(713) 555-5555"`
   - ⚠️ **NOTE**: Your `.env` has `FLUSH_JOHN_PHONE_NUMBER` but constants.js expects `FLUSH_JOHN_PHONE`
   - **Fix**: Add `FLUSH_JOHN_PHONE=(877) 790-7062` (or rename existing variable)

2. **FLUSH_JOHN_PHONE_LINK**
   - Current: Using default `"tel:+17135555555"`
   - ⚠️ **NOTE**: Your `.env` has `FLUSH_JOHN_PHONE_URL` but constants.js expects `FLUSH_JOHN_PHONE_LINK`
   - **Fix**: Add `FLUSH_JOHN_PHONE_LINK=tel:+18777907062` (or rename existing variable)

3. **FLUSH_JOHN_HOMEPAGE**
   - Current: Using default `"https://www.flushjohn.com"`
   - **Fix**: Add if different from default

4. **FLUSH_JOHN_ADDRESS**
   - Current: Using default `"Houston, TX"`
   - **Fix**: Add actual address

5. **FLUSH_JOHN_EMAIL_SIGNATURE**
   - Current: Using default signature template
   - **Fix**: Add custom signature if needed

### QuenGenesis Company Information
6. **QUENGENESIS_PHONE**
   - Current: Empty string `""`
   - **Fix**: Add phone number

7. **QUENGENESIS_HOMEPAGE**
   - Current: Empty string `""`
   - **Fix**: Add homepage URL

8. **QUENGENESIS_EMAIL_SIGNATURE**
   - Current: Using default signature template
   - **Fix**: Add custom signature if needed

### Asset URLs
9. **LOCAL_ASSETS_URL**
   - Current: Using `http://localhost:8080` (fallback)
   - **Fix**: Set if you want a different local assets URL (optional)

### API Base URLs
10. **CRM_BASE_URL**
    - Current: Using default `"http://localhost:3001"`
    - **Fix**: Set if CRM is on different URL

11. **VITE_API_BASE_URL**
    - Current: Using default `"http://localhost:3001"` (fallback for CRM_BASE_URL)
    - **Fix**: Set if using Vite and different URL

12. **API_BASE_URL**
    - Current: Using default `"http://localhost:8080"`
    - **Fix**: Set if API is on different URL

13. **WEB_BASE_URL**
    - Current: Using default `"https://www.flushjohn.com"`
    - **Fix**: Set if website is on different URL

## ✅ Variables That Are Set (Working Correctly)

- `NEXT_PUBLIC_FLUSH_JOHN_EMAIL_ID` ✅
- `NEXT_PUBLIC_QUENGENESIS_EMAIL_ID` ✅
- `CLOUDFRONT_URL` ✅
- `CDN_URL` ✅
- `AWS_S3_BUCKET_NAME` ✅
- `AWS_REGION` ✅

## 🔧 Quick Fix Commands

To add the missing variables to your `.env` file:

```bash
# Fix phone number variable name mismatch
echo "FLUSH_JOHN_PHONE=(877) 790-7062" >> .env
echo "FLUSH_JOHN_PHONE_LINK=tel:+18777907062" >> .env

# Add other missing variables (customize values as needed)
echo "FLUSH_JOHN_HOMEPAGE=https://www.flushjohn.com" >> .env
echo "FLUSH_JOHN_ADDRESS=Houston, TX" >> .env
echo "QUENGENESIS_PHONE=" >> .env
echo "QUENGENESIS_HOMEPAGE=" >> .env
echo "LOCAL_ASSETS_URL=" >> .env
echo "CRM_BASE_URL=http://localhost:3001" >> .env
echo "API_BASE_URL=http://localhost:8080" >> .env
echo "WEB_BASE_URL=https://www.flushjohn.com" >> .env
```

## 📝 Notes

- Variables with defaults are optional but recommended to set explicitly
- The phone number issue is due to variable name mismatch (`FLUSH_JOHN_PHONE_NUMBER` vs `FLUSH_JOHN_PHONE`)
- Empty strings for QuenGenesis are fine if not needed
- Most defaults are reasonable, but phone number should definitely be fixed

