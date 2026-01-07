# Data Normalization Implementation

## Overview

All data is now automatically normalized to **standard, consistent formats** before being saved to the database, regardless of the source (FlushJohn Web, CRM, API, etc.).

## Implementation Date

January 7, 2026

## What Was Implemented

### 1. Central Normalization Utility

**File:** `utils/dataNormalization.ts`

This file contains all normalization functions that ensure data consistency across the entire application.

### 2. Affected Features

Data normalization has been implemented in the following features:

- ✅ **Leads** (create & update)
- ✅ **Quotes** (create & update)
- ✅ **Sales Orders** (create & update)
- ✅ **Job Orders** (create & update)
- ✅ **Customers** (create & update)

## Normalization Rules

### Phone Numbers

**Format:** E.164 International Format (`+1XXXXXXXXXX`)

**Examples:**
```
Input                  → Output
─────────────────────────────────────
"(123) 456-7890"      → "+11234567890"
"123-456-7890"        → "+11234567890"
"+1 234 567 8901"     → "+12345678901"
"2345678901"          → "+12345678901"
"1234567890"          → "+11234567890"
```

**Fields Normalized:**
- `phone`
- `contactPersonPhone`
- `fax`

### Email Addresses

**Format:** Lowercase, trimmed

**Examples:**
```
Input                  → Output
─────────────────────────────────────
"John@Example.COM"    → "john@example.com"
" user@domain.com  "  → "user@domain.com"
```

**Fields Normalized:**
- `email`

### ZIP Codes

**Format:** 5-digit US ZIP code (removes ZIP+4 extension)

**Examples:**
```
Input                  → Output
─────────────────────────────────────
"12345-6789"          → "12345"
"12345"               → "12345"
"123 45"              → "12345"
```

**Fields Normalized:**
- `zip`

### State

**Format:** 
- 2-character abbreviations: UPPERCASE
- Full state names: Title Case

**Examples:**
```
Input                  → Output
─────────────────────────────────────
"tx"                  → "TX"
"TX"                  → "TX"
"texas"               → "Texas"
"TEXAS"               → "Texas"
```

**Fields Normalized:**
- `state`

### Text Fields

**Format:** Trimmed (leading and trailing whitespace removed)

**Examples:**
```
Input                  → Output
─────────────────────────────────────
"  John  "            → "John"
"Smith   "            → "Smith"
```

**Fields Normalized:**
- `fName`
- `lName`
- `cName`
- `contactPersonName`
- `streetAddress`
- `city`
- `instructions`

### Usage Type

**Format:** Title Case (First letter capitalized, rest lowercase)

**Examples:**
```
Input                  → Output
─────────────────────────────────────
"EVENT"               → "Event"
"construction"        → "Construction"
"EMERGENCY"           → "Emergency"
```

**Fields Normalized:**
- `usageType`

## Code Changes

### Service Layer Updates

All service files have been updated to call `normalizeContactData()` before saving or updating data:

#### Leads Service
```typescript
import { normalizeContactData } from "../../../utils/dataNormalization.js";

// In prepareLeadData()
return normalizeContactData(preparedData);

// In updateLead()
const normalizedUpdateData = normalizeContactData(updateData);
```

#### Quotes Service
```typescript
import { normalizeContactData } from "../../../utils/dataNormalization.js";

// In createQuote()
const normalizedQuoteData = normalizeContactData(newQuoteData);

// In updateQuote()
const normalizedLeadFields = normalizeContactData(leadFields);
const normalizedQuoteFields = normalizeContactData(quoteFields);
```

#### Sales Orders Service
```typescript
import { normalizeContactData } from "../../../utils/dataNormalization.js";

// In createSalesOrder()
const normalizedSalesOrderData = normalizeContactData(newSalesOrderData);

// In updateSalesOrder()
const normalizedLeadFields = normalizeContactData(leadFields);
const normalizedSalesOrderFields = normalizeContactData(salesOrderFields);
```

#### Job Orders Service
```typescript
import { normalizeContactData } from "../../../utils/dataNormalization.js";

// In createJobOrder()
const normalizedJobOrderData = normalizeContactData(newJobOrderData);

// In updateJobOrder()
const normalizedLeadFields = normalizeContactData(leadFields);
const normalizedJobOrderFields = normalizeContactData(jobOrderFields);

// In createOrLinkCustomerFromJobOrder()
const normalizedCustomerData = normalizeContactData(customerData);
```

#### Customers Service
```typescript
import { normalizeContactData } from "../../../utils/dataNormalization.js";

// In createCustomer()
const normalizedCustomerData = normalizeContactData(newCustomerData);

// In updateCustomer()
const normalizedUpdateData = normalizeContactData(updateData);
```

## Benefits

### 1. Data Consistency
All phone numbers, emails, ZIP codes, and other fields are stored in a uniform format regardless of how they were entered.

### 2. Better Search and Querying
Normalized data makes it easier to search, filter, and match records across the database.

### 3. Integration Ready
Consistent data formats make it easier to integrate with third-party services (SMS, email, payment processors, etc.).

### 4. Single Source of Truth
The normalization logic lives in one place (`utils/dataNormalization.ts`), making it easy to update if standards change.

### 5. Backward Compatible
Existing data continues to work. New and updated records will use the new normalized format.

## Testing Recommendations

### 1. Test Phone Number Normalization

**From Web Form:**
```
Input: (713) 555-1234
Expected in DB: +17135551234
```

**From CRM:**
```
Input: 713-555-1234
Expected in DB: +17135551234
```

### 2. Test Email Normalization

**From Any Source:**
```
Input: User@Example.COM
Expected in DB: user@example.com
```

### 3. Test ZIP Code Normalization

**From Any Source:**
```
Input: 77001-1234
Expected in DB: 77001
```

## Future Considerations

### 1. Data Migration (Optional)

If you want to normalize **existing** data in the database, you can create a migration script that:
1. Fetches all records
2. Applies normalization
3. Updates records in batches

### 2. Additional Fields

If you add new contact-related fields in the future, add them to the `normalizeContactData()` function in `utils/dataNormalization.ts`.

### 3. International Support

Currently optimized for US data. If you expand internationally:
- Update phone normalization for other country codes
- Update ZIP code normalization for postal codes
- Add validation for international formats

## Validation vs Normalization

**Important Distinction:**

- **Validation** (in validators): Checks if data is in an acceptable format
- **Normalization** (in services): Transforms data into a standard format

Both work together:
1. Validator checks: "Is this a valid phone number?" (10-11 digits)
2. Normalizer transforms: "(123) 456-7890" → "+11234567890"

## Contact

For questions or issues related to data normalization, refer to this document or review the implementation in `utils/dataNormalization.ts`.

