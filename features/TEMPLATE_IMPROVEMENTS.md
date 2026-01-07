# PDF Template Improvements - Summary

## Overview

All PDF templates have been enhanced to meet industry standards for Porta Potty rental businesses. All original templates have been backed up and can be restored if needed.

## Backup Locations

All original templates are backed up in the following locations:

- **Sales Orders**: `features/salesOrders/templates/backup/`
  - `pdf.js.backup`
  - `styles.ts.backup`
- **Quotes**: `features/quotes/templates/backup/`
  - `pdf.js.backup`
  - `styles.ts.backup`
- **Job Orders**: `features/jobOrders/templates/backup/`
  - `pdf.js.backup`
- **Receipts**: `features/payments/templates/backup/`
  - `pdf.js.backup`

## Improvements Made

### 1. Styling Enhancements (`styles.ts`)

- ✅ Removed debug pink color from h4 elements
- ✅ Improved typography hierarchy with consistent font sizes
- ✅ Better spacing and padding throughout
- ✅ Professional color scheme using brand colors (#002B4C)
- ✅ Enhanced table design with better borders and alternating row colors
- ✅ Improved footer layout with better spacing
- ✅ Added print-friendly styles

### 2. Sales Orders Template

- ✅ Added document badge ("Sales Order")
- ✅ Improved header layout with better visual hierarchy
- ✅ Added payment terms section (configurable via `paymentTerms` field or `DEFAULT_PAYMENT_TERMS` env var)
- ✅ Added tax breakdown (subtotal, tax, total) - shows only if tax exists
- ✅ Better organization of customer and delivery information
- ✅ Enhanced "Bill To" section
- ✅ Improved totals section with clear separation

### 3. Quotes Template

- ✅ Added document badge ("Quote")
- ✅ **Added quote expiration date** (defaults to 30 days, configurable via `expirationDays` field)
- ✅ Added payment terms section
- ✅ Added tax breakdown
- ✅ Visual expiration warning box
- ✅ Same layout improvements as Sales Orders

### 4. Job Orders Template

- ✅ Added document badge ("Job Order")
- ✅ Improved vendor and customer information layout
- ✅ Added tax breakdown
- ✅ Better organization of delivery/pickup dates
- ✅ Enhanced legal terms section formatting

### 5. Receipt Template

- ✅ **Added prominent "Payment Successful" badge** (green)
- ✅ Added transaction reference number display
- ✅ Enhanced payment confirmation section
- ✅ Clear payment status indicator ("COMPLETED")
- ✅ Better visual hierarchy
- ✅ Added items table if products are available
- ✅ Improved "Thank you" messaging

## New Features

### Tax Support

All templates now support tax calculation:

- Add `taxRate` field (as percentage, e.g., 8.5 for 8.5%)
- Tax will be calculated and displayed automatically
- Shows: Subtotal → Tax (X%) → Total
- **Single Source of Truth**: All calculations use `utils/taxCalculations.ts`

### Payment Terms

- Sales Orders and Quotes now display payment terms
- Can be set via `paymentTerms` field in data
- Or via environment variables:
  - `DEFAULT_PAYMENT_TERMS` for Sales Orders
  - `DEFAULT_QUOTE_PAYMENT_TERMS` for Quotes
- Default: "Net 30 - Payment due within 30 days of invoice date"

### Quote Expiration

- Quotes now show expiration date
- Default: 30 days from quote creation
- Configurable via `expirationDays` field
- Visual warning box displays expiration date

### Transaction Reference

- Receipts now display transaction reference number
- Uses `transactionId` or `paymentId` from payment data
- Displayed in monospace font for clarity

## How to Revert

If you need to restore the original templates:

```bash
# Restore Sales Order template
cp features/salesOrders/templates/backup/pdf.js.backup features/salesOrders/templates/pdf.js
cp features/salesOrders/templates/backup/styles.ts.backup features/salesOrders/templates/styles.ts

# Restore Quote template
cp features/quotes/templates/backup/pdf.js.backup features/quotes/templates/pdf.js
cp features/quotes/templates/backup/styles.ts.backup features/quotes/templates/styles.ts

# Restore Job Order template
cp features/jobOrders/templates/backup/pdf.js.backup features/jobOrders/templates/pdf.js

# Restore Receipt template
cp features/payments/templates/backup/pdf.js.backup features/payments/templates/pdf.js
```

## Data Field Requirements

### Optional Fields (will enhance templates if provided):

- `taxRate` - Tax rate as percentage (e.g., 8.5)
- `paymentTerms` - Custom payment terms text
- `expirationDays` - Quote expiration in days (default: 30)
- `transactionId` or `paymentId` - For receipt transaction reference

### Existing Fields (unchanged):

All existing fields continue to work as before. The templates are backward compatible.

## Testing Recommendations

1. **Test with tax**: Add `taxRate: 8.5` to test tax calculation
2. **Test payment terms**: Add custom `paymentTerms` to see custom terms
3. **Test quote expiration**: Modify `expirationDays` to see different expiration dates
4. **Test receipt**: Verify transaction reference displays correctly
5. **Print test**: Print PDFs to ensure print-friendly styles work

## Calculation Architecture

### Single Source of Truth

All calculations now use utilities from the `utils` folder:

1. **Product Amount Calculations** (`utils/productAmountCalculations.ts`)

   - `calculateProductAmount(quantity, rate)` - Individual product totals
   - `calculateOrderTotal(products)` - Order subtotal

2. **Tax Calculations** (`utils/taxCalculations.ts`) - **NEW**
   - `calculateTaxAmountCents(subtotalCents, taxRate)` - Tax in cents
   - `calculateTaxAmount(subtotalCents, taxRate)` - Tax as formatted string
   - `calculateOrderTotalsWithTax(products, taxRate)` - Complete totals with tax
   - Returns: `{ subtotal, taxAmount, total, taxRate }`

### Removed Duplicate Code

- ❌ Removed inline `totalAmount()` functions from all templates
- ❌ Removed duplicate tax calculation logic
- ✅ All templates now import and use utility functions

## Notes

- All templates maintain backward compatibility
- Missing optional fields will not break templates
- Tax section only appears if `taxRate > 0`
- Payment terms section only appears if `paymentTerms` is provided or env var is set
- Quote expiration defaults to 30 days if not specified
- **All calculations follow single source of truth principle**
