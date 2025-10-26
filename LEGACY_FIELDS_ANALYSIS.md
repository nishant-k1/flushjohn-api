# Legacy Fields Analysis - flushjohn-api

## ⚠️ Key Finding

After analyzing actual code usage, I discovered that **display numbers are NOT legacy** - they're actively used. The real legacy fields are **duplicate data fields** that copy information from referenced documents.

## Fields to KEEP (Not Legacy)

These are actively used for display and should NOT be removed:

- ✅ `customerNo` (Number) - Display number, used in PDFs/emails
- ✅ `leadNo` (Number/String) - Display number, used in PDFs/emails  
- ✅ `salesOrderNo` (Number) - Display number, used in PDFs/emails
- ✅ `quoteNo` (Number) - Display number

## Fields to REMOVE (True Legacy Fields)

These duplicate data that should come from references:

### 1. SalesOrders Model (`features/salesOrders/models/SalesOrders/index.js`)

**Remove these duplicate fields:**
- ❌ `fName`, `lName`, `cName` - Duplicate customer data (currently used in templates!)
- ❌ `email`, `phone`, `fax` - Duplicate customer data
- ❌ `streetAddress`, `city`, `state`, `zip`, `country` - Duplicate customer data
- ❌ `usageType` - Available via `lead` reference
- ⚠️ `products` - Verify if needed for sales-specific data
- ⚠️ `deliveryDate`, `pickupDate` - Verify if different from customer
- ⚠️ `contactPersonName`, `contactPersonPhone` - Verify if different from customer
- ⚠️ `instructions` - Might be sales-order specific

**Keep for now:**
- ✅ `customerNo` - Display number
- ✅ `leadNo` - Display number
- ✅ `salesOrderNo` - Display number  
- ✅ `note` - Sales order specific
- ✅ `billingCycles` - Sales order specific

### 2. Quotes Model (`features/quotes/models/Quotes/index.js`)

**Remove these duplicate fields:**
- ❌ `leadId` (String) - Duplicate of `lead` ObjectId reference
- ❌ `fName`, `lName`, `cName` - Duplicate customer/lead data
- ❌ `email`, `phone`, `fax` - Duplicate customer/lead data
- ❌ `streetAddress`, `city`, `state`, `zip`, `country` - Duplicate customer/lead data
- ❌ `usageType` - Available via `lead` reference
- ⚠️ `products` - Verify if needed for quote-specific data
- ⚠️ `deliveryDate`, `pickupDate` - Verify if different from lead
- ⚠️ `contactPersonName`, `contactPersonPhone` - Verify if different from lead
- ⚠️ `instructions` - Might be quote-specific

**Keep for now:**
- ✅ `customerNo` - Display number
- ✅ `leadNo` - Display number
- ✅ `quoteNo` - Display number
- ✅ `note` - Quote specific

### 3. JobOrders Model (`features/jobOrders/models/JobOrders/index.js`)

**Remove these duplicate fields:**
- ❌ `fName`, `lName`, `cName` - Duplicate customer data
- ❌ `email`, `phone`, `fax` - Duplicate customer data
- ❌ `streetAddress`, `city`, `state`, `zip`, `country` - Duplicate customer data
- ❌ `usageType` - Available via salesOrder/lead reference
- ⚠️ `products` - Verify if needed for job-specific data
- ⚠️ `deliveryDate`, `pickupDate` - Verify if different from sales order
- ⚠️ `contactPersonName`, `contactPersonPhone` - Verify if different from sales order
- ⚠️ `instructions` - Might be job-specific

**Keep for now:**
- ✅ `salesOrderNo` - Display number
- ✅ `customerNo` - Display number
- ✅ `vendorAcceptanceStatus` - Job order specific
- ✅ `vendorHistory` - Job order specific
- ✅ `note` - Job order specific

### 4. Customers Model (`features/customers/models/Customers/index.js`)

**Remove these legacy array fields:**
- ❌ `salesOrderNo` (Number[]) - Use `salesOrders` reference array instead
- ❌ `quoteNo` (Number[]) - Use `quotes` reference array instead

**Keep these (customer's own data):**
- ✅ `fName`, `lName`, `cName` - Customer's own name
- ✅ `email`, `phone`, `fax` - Customer's own contact
- ✅ `streetAddress`, `city`, `state`, `zip`, `country` - Customer's own address
- ✅ `customerNo` - Display number

**Move to sales order level:**
- ⚠️ `deliveryDate`, `pickupDate` - Should be on sales order
- ⚠️ `contactPersonName`, `contactPersonPhone` - Should be on sales order
- ⚠️ `products` - Should be on sales order
- ⚠️ `instructions` - Should be on sales order
- ✅ `note` - Keep for customer-specific notes

### 5. Blogs Model (`features/blogs/models/Blogs/index.js`)

**Remove this duplicate field:**
- ❌ `coverImage` (lines 118-134) - Duplicate of `cover` reference

## Impact Analysis

### Critical Files That Need Updates:

1. **Templates** (Currently reading legacy fields):
   - `features/salesOrders/templates/pdf/index.js` - Uses `fName`, `lName`, `cName`
   - `features/salesOrders/templates/email/index.js` - Uses `fName`, `lName`

2. **Services** (Currently setting legacy fields):
   - `features/salesOrders/services/salesOrdersService.js` - Sets `customerNo`, duplicates data
   - `features/quotes/services/quotesService.js` - Check if setting duplicates
   - `features/jobOrders/services/jobOrdersService.js` - Check if setting duplicates

## Migration Strategy

### Phase 1: Update Code to Use References
1. Update templates to use `.populate()` to fetch customer/lead data
2. Update services to stop setting duplicate fields
3. Keep reading legacy fields as fallback for backward compatibility

### Phase 2: Remove Duplicate Data Setting
1. Remove code that sets `fName`, `lName`, `cName`, etc. on orders/quotes/jobs
2. Keep reading them as fallback for old records

### Phase 3: Database Cleanup
1. Run migration to copy legacy data to references where missing
2. Verify all records have proper references set

### Phase 4: Remove Legacy Fields
1. Remove legacy fields from schema definitions
2. Update templates to only use references
3. Remove fallback code

## Estimated Effort

- **Blogs:** 1 hour (simple - 1 field)
- **Quotes:** 4-6 hours (multiple fields, templates)
- **SalesOrders:** 6-8 hours (most complex, many templates)
- **JobOrders:** 4-6 hours (multiple fields)
- **Customers:** 2-3 hours (cleanup arrays)

**Total:** ~17-24 hours

## Risk Level

🟡 **Medium Risk** - Templates currently depend on these fields, so careful testing required
