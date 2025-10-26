# Customer Data Source Strategy

## Overview

This document outlines the strategy for accessing customer contact information (fName, lName, cName, email, phone, fax, address, etc.) in Quote, SalesOrder, and JobOrder models.

## Principle: Use Customer Reference When Available, Lead Reference Otherwise

**Important Timeline:**

1. **Lead** created → has contact info
2. **Quote** created → NO customer yet, uses Lead reference
3. **SalesOrder** created → NO customer yet, uses Lead reference  
4. **SalesOrder email sent** → Customer created, SalesOrder linked to Customer
5. **JobOrder** created → Customer exists, uses Customer reference

**Key Insight:**
- Quote and SalesOrder are created BEFORE customer exists
- They initially use Lead reference for contact info
- Once customer is created (when email sent), Customer becomes authoritative
- JobOrder always uses Customer reference since it's created AFTER

## Data Hierarchy

When accessing customer contact information, use this priority order:

### 1. **Customer Reference** (Primary Source)

```javascript
const quote = await Quote.findById(id).populate("customer");
// Use: quote.customer.fName, quote.customer.email, etc.
```

### 2. **Lead Reference** (Fallback)

```javascript
// If customer doesn't exist yet, fall back to lead
const lead = await Lead.findById(quote.lead);
// Use: lead.fName, lead.email, etc.
```

### 3. **Inline Fields** (Legacy - Do NOT use for new code)

```javascript
// These are being phased out
// quote.fName, quote.email, etc.
```

## Application Logic

### When Creating Quote/SalesOrder/JobOrder:

```javascript
// Best Practice: Store references, don't duplicate data
const salesOrder = {
  lead: leadId, // Reference
  customer: customerId, // Reference (may be null initially)
  // DON'T copy fName, email, etc. inline
};
```

### When Accessing Customer Data:

```javascript
// In services/controllers
async function getSalesOrderWithCustomerData(salesOrderId) {
  const salesOrder = await SalesOrder.findById(salesOrderId)
    .populate("customer") // May be null initially
    .populate("lead");    // Always populated

  // Customer is created later, so check if it exists
  // Use customer data if available, otherwise use lead data
  const customerData = salesOrder.customer || salesOrder.lead;

  return {
    fName: customerData.fName,
    email: customerData.email,
    // etc.
  };
}
```

### Timeline Example:

```javascript
// When creating Quote (Customer doesn't exist yet)
const quote = await Quote.create({
  lead: leadId,           // ✅ Must use Lead
  customer: null,         // ❌ Customer doesn't exist yet
});

// When creating SalesOrder (Customer still doesn't exist)
const salesOrder = await SalesOrder.create({
  lead: leadId,           // ✅ Must use Lead
  customer: null,         // ❌ Customer doesn't exist yet
});

// After sending email, Customer is created and linked
await sendSalesOrderEmail(); // Creates Customer
// Now salesOrder.customer is populated ✅

// When creating JobOrder (Customer exists)
const jobOrder = await JobOrder.create({
  customer: customerId,   // ✅ Customer exists!
  salesOrder: salesOrderId,
});
```

## Current Model Status

### ✅ JobOrders

- Has `customer` reference
- Has `lead` reference
- Has `salesOrder` reference

### ✅ SalesOrders

- Has `customer` reference
- Has `lead` reference
- Has `quote` reference

### ✅ Quotes

- Has `customer` reference
- Has `lead` reference

## Migration Path

### Phase 1: Update Code to Use References (Current)

- Stop reading/writing inline fields
- Use `.populate()` to fetch customer/lead data
- Update services and controllers

### Phase 2: Remove Inline Fields (Future)

- Once all code uses references
- Remove commented-out fields from schema
- Clean up database

## Code Examples

### ✅ GOOD: Using References

```javascript
// In PDF generation
const salesOrder = await SalesOrder.findById(id)
  .populate("customer")
  .populate("lead");

const customerData = salesOrder.customer || salesOrder.lead;
const fullName = `${customerData.fName} ${customerData.lName}`;
```

### ❌ BAD: Using Inline Fields

```javascript
// DON'T DO THIS
const fullName = `${salesOrder.fName} ${salesOrder.lName}`;
```

## Summary

**Answer to your question:**

**Quote & SalesOrder:**
- Initially use **Lead reference** (customer doesn't exist yet)
- After email sent, Customer created → use **Customer reference** as primary
- Lead becomes fallback if Customer deleted/changed

**JobOrder:**
- Always use **Customer reference** (customer exists by this point)
- Lead reference is for historical tracking only

**Don't duplicate fields inline** (they're being removed)
