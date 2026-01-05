# When Does a Lead Get a Customer Reference?

## Answer: When a Sales Order is Created from the Lead

The `customer` reference field on a Lead is set **automatically when a Sales Order is created from that Lead**, specifically when a **new Customer is created**.

## Flow Diagram

```
Lead Created
    ↓
Sales Order Created from Lead
    ↓
createOrLinkCustomerFromSalesOrder() called
    ↓
Check if Customer exists (by email)
    ↓
┌─────────────────────┬─────────────────────────────┐
│                     │                             │
Customer DOESN'T exist          Customer EXISTS
│                     │                             │
↓                     ↓                             ↓
Create NEW Customer   Link Sales Order to          Update Lead:
                      existing Customer            lead.customer = customer._id
                      (line 1104-1109)             (line 1092-1094)
│                     │                             
↓                     ↓                             
Update Lead:          ❌ Does NOT update Lead's    
lead.customer =       customer reference
customer._id          (only updates Customer)
(line 1092-1094)
```

## Code Location

**File**: `features/salesOrders/services/salesOrdersService.ts`

**Function**: `createOrLinkCustomerFromSalesOrder()` (line 1046)

**Called from**: `createSalesOrder()` (line 150)

## Detailed Logic

### Scenario 1: New Customer Created

```typescript
// Line 1079-1094
if (!customer) {
  // Create new customer
  customer = await Customers.create({
    ...customerData,
    customerNo,
    salesOrders: [salesOrder._id],
  });

  // ✅ Set customer reference on Lead
  await Leads.findByIdAndUpdate(lead._id, {
    customer: customer._id,  // <-- THIS is when hasCustomerNo becomes true
  });
}
```

**When this happens**:
- First time a Sales Order is created from this Lead
- OR first time this email/phone creates a Sales Order

### Scenario 2: Customer Already Exists

```typescript
// Line 1103-1118
else {
  // Link Sales Order to existing Customer
  await Customers.findByIdAndUpdate(customer._id, {
    $addToSet: {
      salesOrders: salesOrder._id,
    },
  });
  
  // ❌ Does NOT update Lead's customer reference
  // Lead.customer field remains unchanged
}
```

**When this happens**:
- Customer already exists (created from previous Sales Order)
- Sales Order is just linked to existing Customer
- **Lead's customer reference is NOT updated** (potential gap)

## Important Notes

1. **Timing**: The `customer` reference is set **immediately when Sales Order is created**, not later

2. **Condition**: Only set when a **NEW Customer is created**. If Customer already exists, the Lead's customer reference is NOT updated

3. **Location**: The update happens in `createOrLinkCustomerFromSalesOrder()` function, called from `createSalesOrder()`

4. **Query Filter**: The `hasCustomerNo` filter checks: `{ customer: { $exists: true, $ne: null } }`
   - This checks if the `customer` field exists and is not null
   - Leads with `customer: null` or no `customer` field will NOT match

## Potential Issue

**Gap in Logic**: If a Lead creates a Sales Order and the Customer already exists (from a previous Sales Order), the Lead's `customer` reference is **NOT set**. This means:

- The Lead won't show up in "Show Customers Only" filter
- Even though a Customer exists for that email
- Even though a Sales Order was created from that Lead

**Recommendation**: Also update Lead's customer reference when Customer already exists:

```typescript
else {
  // Link Sales Order to existing Customer
  await Customers.findByIdAndUpdate(customer._id, {
    $addToSet: {
      salesOrders: salesOrder._id,
    },
  });
  
  // ✅ SHOULD ALSO UPDATE LEAD'S CUSTOMER REFERENCE
  await Leads.findByIdAndUpdate(lead._id, {
    customer: customer._id,
  });
}
```

## Summary

- **When**: When a Sales Order is created from a Lead
- **Condition**: Only when a NEW Customer is created (not when Customer already exists)
- **Location**: `createOrLinkCustomerFromSalesOrder()` function
- **Result**: `lead.customer = customer._id` is set, making `hasCustomerNo` filter return true

