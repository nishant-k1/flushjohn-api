# MongoDB Relationships Implementation Guide

**Date:** $(date)
**Status:** ✅ Model updates complete, migration ready

---

## What Was Implemented

### 1. ✅ Added ObjectId References to All Models

All models now have proper MongoDB relationships alongside legacy fields for backward compatibility.

---

## Model Changes

### Lead Model ✅

**Added:**

```javascript
quotes: [{ type: Schema.Types.ObjectId, ref: 'Quote' }],
salesOrders: [{ type: Schema.Types.ObjectId, ref: 'SalesOrder' }],
jobOrders: [{ type: Schema.Types.ObjectId, ref: 'JobOrder' }],
customer: { type: Schema.Types.ObjectId, ref: 'Customer' }
```

**Kept:** All existing fields for backward compatibility

---

### Quote Model ✅

**Added:**

```javascript
lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true }
```

**Kept:** `leadNo`, `leadId`, `customerNo`, and all contact fields for backward compatibility

---

### SalesOrder Model ✅

**Added:**

```javascript
quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', index: true },
lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true }
```

**Kept:** `leadNo`, `customerNo`, and all contact fields for backward compatibility

---

### JobOrder Model ✅

**Added:**

```javascript
salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', index: true },
lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true }
```

**Updated:** Vendor reference now properly references Vendor model

**Kept:** `salesOrderNo`, `customerNo`, and all contact fields for backward compatibility

---

### Customer Model ✅

**Added:**

```javascript
quotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quote' }],
salesOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' }],
jobOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder' }]
```

**Kept:** All existing fields

---

## How to Use the New Relationships

### 1. Create Quote with Lead Reference

**Before (Old Way):**

```javascript
const quote = await Quote.create({
  leadNo: lead.leadNo,
  leadId: lead._id.toString(),
  fName: lead.fName,
  lName: lead.lName,
  email: lead.email,
  // ... duplicate all contact fields
});
```

**After (New Way):**

```javascript
const quote = await Quote.create({
  lead: lead._id, // ✅ Just reference the lead
  // No need to duplicate contact fields!
  quoteNo: await generateQuoteNumber(),
  products: quoteData.products,
  // ... only quote-specific fields
});
```

---

### 2. Fetch Quote with Related Lead

**Old Way:**

```javascript
const quote = await Quote.findById(quoteId);
const lead = await Lead.findOne({ leadNo: quote.leadNo }); // Manual lookup
console.log(lead.email); // Access lead email
```

**New Way:**

```javascript
const quote = await Quote.findById(quoteId)
  .populate("lead") // ✅ Automatically fetch lead
  .populate("customer"); // ✅ Automatically fetch customer

console.log(quote.lead.email); // Access lead email directly
console.log(quote.customer.email); // Access customer email
```

---

### 3. Get All Quotes for a Lead

**Old Way:**

```javascript
const leads = await Lead.find();
const quotes = await Quote.find();

// Manual join
const leadQuotes = leads.map((lead) => ({
  lead,
  quotes: quotes.filter((q) => q.leadNo === lead.leadNo),
}));
```

**New Way:**

```javascript
const lead = await Lead.findById(leadId).populate("quotes"); // ✅ Automatic join

console.log(lead.quotes); // All quotes for this lead
```

---

### 4. Get Sales Order with Full History

**Old Way:**

```javascript
const salesOrder = await SalesOrder.findById(orderId);
const quote = await Quote.findOne({ quoteNo: salesOrder.quoteNo });
const lead = await Lead.findOne({ leadNo: salesOrder.leadNo });
const customer = await Customer.findOne({ customerNo: salesOrder.customerNo });
// Multiple queries, manual joining
```

**New Way:**

```javascript
const salesOrder = await SalesOrder.findById(orderId)
  .populate("quote")
  .populate("lead")
  .populate("customer");

// One query, all related data loaded!
console.log(salesOrder.quote.quoteNo);
console.log(salesOrder.lead.email);
console.log(salesOrder.customer.phone);
```

---

### 5. Update Services to Use References

**Example: Quote Service**

```javascript
export const createQuote = async (quoteData) => {
  // If lead ID provided, use reference
  if (quoteData.leadId) {
    const lead = await Lead.findById(quoteData.leadId);
    if (!lead) throw new Error("Lead not found");

    quoteData.lead = lead._id; // Use ObjectId reference
  }

  // Same for customer
  if (quoteData.customerId) {
    const customer = await Customer.findById(quoteData.customerId);
    if (customer) {
      quoteData.customer = customer._id;
    }
  }

  const quote = await Quote.create(quoteData);

  // Update lead's quotes array
  if (quote.lead) {
    await Lead.findByIdAndUpdate(quote.lead, {
      $push: { quotes: quote._id },
    });
  }

  return quote;
};
```

---

## Migration Steps

### Step 1: Deploy Updated Models

✅ Already done - models updated with new reference fields

### Step 2: Run Migration Script

```bash
node scripts/migrateToRelationships.js
```

This will:

- Find all quotes and link them to leads
- Find all sales orders and link them to quotes/leads/customers
- Find all job orders and link them to sales orders
- Populate the new reference fields from existing data

### Step 3: Test Application

- Verify existing functionality still works
- Check that references are populated
- Test creating new records with references

### Step 4: Update Services Gradually

- Start using new reference fields in new code
- Keep legacy fields for backward compatibility
- Update services one at a time

### Step 5: Remove Legacy Fields (Future)

After all services updated and tested:

- Remove `leadNo`, `leadId` string fields
- Remove duplicate contact fields from Quote/SalesOrder/JobOrder
- Keep only references

---

## Example Service Updates

### Update deleteLead to Check References

```javascript
export const deleteLead = async (id) => {
  const existingLead = await leadsRepository.findById(id);
  if (!existingLead) throw new Error("Lead not found");

  // Check references using proper relationships
  const Quote = (await import("../../quotes/models/Quotes/index.js")).default;
  const SalesOrder = (
    await import("../../salesOrders/models/SalesOrders/index.js")
  ).default;
  const JobOrder = (await import("../../jobOrders/models/JobOrders/index.js"))
    .default;

  const [quotesCount, salesOrdersCount, jobOrdersCount] = await Promise.all([
    Quote.countDocuments({ lead: id }), // ✅ Use ObjectId reference
    SalesOrder.countDocuments({ lead: id }), // ✅ Use ObjectId reference
    JobOrder.countDocuments({ lead: id }), // ✅ Use ObjectId reference
  ]);

  if (quotesCount > 0 || salesOrdersCount > 0 || jobOrdersCount > 0) {
    const error = new Error(
      `Cannot delete lead. Related records exist: ${quotesCount} quote(s), ${salesOrdersCount} sales order(s), ${jobOrdersCount} job order(s).`
    );
    error.name = "DeletionBlockedError";
    error.details = { quotesCount, salesOrdersCount, jobOrdersCount };
    throw error;
  }

  await leadsRepository.deleteById(id);
  return { _id: id };
};
```

---

## Benefits

### 1. Automatic Joins

```javascript
// One query instead of multiple
const lead = await Lead.findById(id).populate("quotes");
// quotes automatically loaded!
```

### 2. Data Integrity

```javascript
// Can't reference non-existent lead
const quote = await Quote.create({ lead: "invalid_id" });
// MongoDB validates reference exists
```

### 3. Single Source of Truth

```javascript
// Update customer email once
await Customer.findByIdAndUpdate(customerId, { email: "new@email.com" });

// All sales orders automatically get new email via populate
const orders = await SalesOrder.find().populate("customer");
orders.forEach((order) => console.log(order.customer.email)); // new@email.com
```

### 4. Better Performance

```javascript
// Database optimizes joins
const stats = await Lead.aggregate([
  {
    $lookup: {
      from: "quotes",
      localField: "_id",
      foreignField: "lead",
      as: "quotes",
    },
  },
]);
// Much faster than manual JavaScript loops
```

---

## Testing the New Relationships

### Test Creating with References

```javascript
// Create lead
const lead = await Lead.create({
  fName: "John",
  lName: "Doe",
  email: "john@example.com",
});

// Create quote referencing lead
const quote = await Quote.create({ lead: lead._id, quoteNo: 1001 });

// Fetch quote with lead populated
const populatedQuote = await Quote.findById(quote._id).populate("lead");
console.log(populatedQuote.lead.email); // 'john@example.com'
```

### Test Querying Relationships

```javascript
// Get all quotes for a lead
const lead = await Lead.findById(leadId).populate("quotes");
console.log(lead.quotes.length); // Number of quotes

// Get all sales orders for a quote
const quote = await Quote.findById(quoteId).populate("salesOrders");
```

---

## Next Steps

1. ✅ Models updated with references
2. ✅ Migration script created
3. ⏳ Run migration: `node scripts/migrateToRelationships.js`
4. ⏳ Update services to use new references
5. ⏳ Test thoroughly
6. ⏳ Gradually remove legacy fields

---

## Important Notes

⚠️ **Backward Compatibility Maintained**

- All legacy fields (`leadNo`, `leadId`, contact fields) are still present
- Existing code will continue to work
- New code can use references
- Both can coexist during transition

⚠️ **Do NOT Remove Legacy Fields Yet**

- Keep them until all services are updated
- They're marked with comments `🔄 Legacy fields`
- Remove only after thorough testing

⚠️ **Migration Runs Once**

- The migration script populates new fields from old data
- Safe to run multiple times (skips already migrated records)
- Doesn't delete or modify existing data

---

## Files Modified

1. ✅ `features/leads/models/Leads/index.js` - Added references
2. ✅ `features/quotes/models/Quotes/index.js` - Added references
3. ✅ `features/salesOrders/models/SalesOrders/index.js` - Added references
4. ✅ `features/jobOrders/models/JobOrders/index.js` - Added references
5. ✅ `features/customers/models/Customers/index.js` - Added references
6. ✅ `scripts/migrateToRelationships.js` - Migration script created

**Ready to migrate!** Run `node scripts/migrateToRelationships.js` to populate references.
