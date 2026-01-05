# Customers vs Leads Architecture

## Current Architecture (Active - NOT Legacy)

### Two Separate Collections

1. **Leads Collection** (`leads`)
   - Purpose: Potential customers who have shown interest but haven't made a purchase yet
   - Created: When someone submits a lead form or is manually entered
   - Key Fields:
     - `leadNo` (unique number)
     - `leadStatus`, `leadSource`, `assignedTo`
     - Contact info: `fName`, `lName`, `email`, `phone`, etc.
     - `customer` (ObjectId reference) - **Points to Customer when converted**
   - Relationships:
     - Can have multiple `quotes`, `salesOrders`, `jobOrders`
     - Has optional `customer` reference (one-way: Lead → Customer)

2. **Customers Collection** (`customers`)
   - Purpose: **Actual customers who have made a purchase** (created when Sales Order is created)
   - Created: Automatically when a Sales Order is created from a Lead
   - Key Fields:
     - `customerNo` (unique number, starts at 1000)
     - Contact info: `fName`, `lName`, `email`, `phone`, etc.
   - Relationships:
     - Can have multiple `quotes`, `salesOrders`, `jobOrders`
     - **NOT a reference from Lead** (one-way relationship)

### Conversion Flow

```
Lead (Potential Customer)
    ↓
Sales Order Created from Lead
    ↓
Customer Automatically Created (if doesn't exist)
    ↓
Lead.customer field updated to reference Customer
```

**Code Location**: `features/salesOrders/services/salesOrdersService.ts`
- Function: `createOrLinkCustomerFromSalesOrder()`
- Called: When Sales Order is created (line 150)

### Data Flow

1. **Lead Creation**:
   - User submits lead form → Lead created in `leads` collection
   - No customer exists yet

2. **Sales Order Creation**:
   - Sales Order created from Lead
   - System checks if Customer exists (by email)
   - If Customer doesn't exist:
     - Creates new Customer in `customers` collection
     - Copies contact info from Lead
     - Assigns `customerNo` (incremental, starts at 1000)
   - If Customer exists:
     - Links Sales Order to existing Customer
   - Updates Lead: `lead.customer = customer._id`
   - Updates Sales Order: `salesOrder.customer = customer._id`, `salesOrder.customerNo = customer.customerNo`

3. **Customer List**:
   - Should query `/customers` endpoint (NOT `/leads`)
   - Shows only customers who have Sales Orders
   - Each customer can have multiple Sales Orders

## What Was Wrong (Fixed)

### Frontend Bug (FIXED)

**File**: `src/features/customers/useCustomers.ts`

**Problem**:
```typescript
const URL = `${API_BASE_URL}/leads`; // ❌ WRONG - Customers are leads with customerNo
hasCustomerNo: true, // ❌ WRONG - This filter doesn't exist
```

**Why Wrong**:
1. Customers are NOT leads with a `customerNo` field
2. Leads don't have `customerNo` field
3. `/leads` endpoint doesn't support `hasCustomerNo` filter
4. Result: Customer list showed ALL leads, not just customers

**Fixed**:
```typescript
const URL = `${API_BASE_URL}/customers`; // ✅ CORRECT
// Removed hasCustomerNo filter (not needed)
```

## API Endpoints

### Correct Endpoints

- **Leads**: `/leads` → Returns leads (potential customers)
- **Customers**: `/customers` → Returns customers (actual customers with sales orders)
- **Sales Orders**: `/salesOrders` → Returns sales orders
- **Quotes**: `/quotes` → Returns quotes

### Endpoint Usage

| Frontend Page | Should Call | Purpose |
|--------------|-------------|---------|
| Leads List | `/leads` | Show all potential customers |
| Customers List | `/customers` | Show only actual customers |
| Sales Orders List | `/salesOrders` | Show all sales orders |
| Quotes List | `/quotes` | Show all quotes |

## Database Schema Relationships

```
Lead
├── customer: ObjectId (optional, points to Customer when converted)
├── quotes: [ObjectId]
├── salesOrders: [ObjectId]
└── jobOrders: [ObjectId]

Customer
├── salesOrders: [ObjectId]
├── quotes: [ObjectId]
├── jobOrders: [ObjectId]
└── NO reference back to Lead (one-way relationship)

SalesOrder
├── lead: ObjectId (required if from lead)
├── customer: ObjectId (set when customer created)
├── customerNo: Number (for display)
└── leadNo: String (for display)
```

## Key Points

1. **Customers Collection is NOT Legacy** - It's actively used and required
2. **Customers are created automatically** - When Sales Order is created from Lead
3. **Leads and Customers are separate** - Different collections, different purposes
4. **One-way relationship** - Lead → Customer (Lead has `customer` field, Customer doesn't reference Lead)
5. **Customer list should use `/customers` endpoint** - NOT `/leads` with filters

## Migration History

If there was confusion about "legacy" customers:
- The **Customers collection itself is NOT legacy**
- Some **fields within Customers** were removed (like `deliveryDate`, `pickupDate` on customer level - these belong on Sales Order level)
- The **relationship structure** was refactored to use MongoDB references instead of string IDs
- But the **Customers collection is essential** and actively used

## Verification

To verify the current state:
1. Check `features/customers/models/Customers.ts` - Collection exists and is active
2. Check `features/customers/routes/customers.ts` - Routes exist and are registered
3. Check `app.ts` line 283 - `/customers` route is registered
4. Check `features/salesOrders/services/salesOrdersService.ts` line 150 - Customer creation happens automatically

