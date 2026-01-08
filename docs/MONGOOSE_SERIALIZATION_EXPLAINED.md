# Mongoose Serialization/Deserialization - What Happens Automatically

## 🔍 Quick Answer: Phone Numbers

**Mongoose does NOT automatically format phone numbers.**

Phone is just a `String` type, so Mongoose:
- ✅ Stores it as-is (whatever string you provide)
- ✅ Retrieves it as-is (same string)
- ✅ Applies `trim: true` (removes whitespace)
- ❌ Does NOT convert formats (E.164, display, etc.)

**Phone normalization happens in Stage 3 (Express middleware), not Stage 4 (Mongoose).**

---

## 📊 What Mongoose DOES Automatically

### **1. Date Conversion ✅**

**This is the main automatic serialization/deserialization!**

```typescript
// Schema
deliveryDate: {
  type: Date  // ← Type is Date
}

// When SAVING (JavaScript → MongoDB)
Input:  new Date("2026-01-08")  // JavaScript Date object
Stored: ISODate("2026-01-08T00:00:00.000Z")  // MongoDB ISODate

// When RETRIEVING (MongoDB → JavaScript)
Stored: ISODate("2026-01-08T00:00:00.000Z")  // MongoDB ISODate
Output: new Date("2026-01-08")  // JavaScript Date object
```

**This is automatic!** You don't need to do anything.

---

### **2. Text Options (trim, lowercase, uppercase) ✅**

```typescript
// Schema
email: {
  type: String,
  lowercase: true,  // ← Automatic conversion
  trim: true        // ← Automatic trim
}

state: {
  type: String,
  uppercase: true   // ← Automatic conversion
}

// When SAVING
Input:  "  John@Example.com  "
Stored: "john@example.com"  // lowercase + trim applied

Input:  "  tx  "
Stored: "TX"  // uppercase + trim applied
```

**This is automatic!** Mongoose applies these transformations.

---

### **3. ObjectId Conversion ✅**

```typescript
// Schema
lead: {
  type: Schema.Types.ObjectId,
  ref: "Lead"
}

// When SAVING
Input:  "507f1f77bcf86cd799439011"  // String
Stored: ObjectId("507f1f77bcf86cd799439011")  // MongoDB ObjectId

// When RETRIEVING (without populate)
Stored: ObjectId("507f1f77bcf86cd799439011")
Output: "507f1f77bcf86cd799439011"  // String

// When RETRIEVING (with populate)
Output: { _id: "507f...", fName: "John", ... }  // Full document
```

---

## ❌ What Mongoose DOES NOT Do Automatically

### **1. Phone Number Formatting ❌**

```typescript
// Schema
phone: {
  type: String,  // ← Just a String
  trim: true     // ← Only trims whitespace
}

// Mongoose does NOT convert phone formats
Input:  "(713) 555-1234"
Stored: "(713) 555-1234"  // Stored as-is (after trim)

Input:  "+17135551234"
Stored: "+17135551234"  // Stored as-is

// ⚠️ Mongoose doesn't know about E.164 or display formats
// That's why we need middleware to normalize BEFORE Mongoose
```

**Phone normalization must be done BEFORE reaching Mongoose:**
- ✅ Done in Express middleware (Stage 3)
- ✅ Uses `utils/serializers.ts`
- ❌ Not done by Mongoose (Stage 4)

---

### **2. Email Validation ❌**

```typescript
// Schema
email: {
  type: String,
  lowercase: true,  // ← Converts to lowercase
  trim: true        // ← Trims whitespace
  // ❌ Doesn't validate email format!
}

// Mongoose applies lowercase/trim but doesn't validate
Input:  "  not-an-email  "
Stored: "not-an-email"  // ← Invalid email but Mongoose allows it!

// For validation, you need:
email: {
  type: String,
  lowercase: true,
  trim: true,
  validate: {  // ← Manual validation needed
    validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Invalid email'
  }
}
```

---

### **3. Complex Business Logic ❌**

```typescript
// Mongoose doesn't handle:
// - ZIP code formatting (12345 vs 12345-6789)
// - Currency formatting ($1,234.56)
// - Custom transformations
// - Business rules

// These must be handled in middleware or services
```

---

## 🔄 Complete Phone Number Flow

### **Stage 1: Client Display**
```typescript
// User sees: (713) 555-1234
// Format: Display-friendly with parentheses and dashes
```

### **Stage 2: Client API Boundary (Axios Interceptor)**
```typescript
// Before sending to server
Input:  "(713) 555-1234"
Output: "+17135551234"  // ← Converted to E.164 by utils/serializers.tsx
```

### **Stage 3: Server API Boundary (Express Middleware)**
```typescript
// Middleware receives: "+17135551234"
// Validates and ensures it's E.164 format
// Uses utils/serializers.ts

// If it comes in wrong format, middleware normalizes it
Input:  "713-555-1234"
Output: "+17135551234"  // ← Normalized by middleware
```

### **Stage 4: Database (Mongoose)**
```typescript
// Mongoose receives: "+17135551234"
// Schema: { type: String, trim: true }

// Mongoose just stores it as-is
Stored: "+17135551234"  // ← No conversion, just storage

// When retrieving
Retrieved: "+17135551234"  // ← Same string, no conversion
```

### **Stage 3 → 2 → 1: Response Flow**
```typescript
// From database
MongoDB: "+17135551234"

// Mongoose returns
Output: "+17135551234"  // ← No conversion

// Server sends via HTTP
Response: "+17135551234"  // ← JSON string

// Client receives (Axios)
Received: "+17135551234"  // ← No conversion needed

// Client displays
Display: "(713) 555-1234"  // ← Formatted by utils/phoneFormatter.tsx
```

---

## 📋 Summary Table

| Data Type | Mongoose Auto-Converts? | Where Conversion Happens |
|-----------|------------------------|--------------------------|
| **Date** | ✅ Yes | Mongoose (Stage 4) |
| **ObjectId** | ✅ Yes | Mongoose (Stage 4) |
| **lowercase/uppercase** | ✅ Yes | Mongoose (Stage 4) |
| **trim** | ✅ Yes | Mongoose (Stage 4) |
| **Phone** | ❌ No | Middleware (Stage 3) |
| **Email format** | ❌ No | Middleware (Stage 3) |
| **ZIP code** | ❌ No | Middleware (Stage 3) |
| **Business logic** | ❌ No | Middleware (Stage 3) |

---

## 🎯 Key Takeaway

### **Mongoose Handles:**
- ✅ Type conversions (Date, ObjectId, Number, Boolean)
- ✅ Simple text transformations (trim, lowercase, uppercase)
- ✅ Schema validation (required, min, max)

### **Mongoose DOES NOT Handle:**
- ❌ Phone formatting (E.164, display, etc.)
- ❌ Email validation (format checking)
- ❌ Complex business logic
- ❌ Custom serialization rules

**That's why we need Express middleware (Stage 3) to handle phone/email normalization BEFORE it reaches Mongoose!**

---

## 📊 Responsibility Division

```
┌─────────────────────────────────────────────────────────┐
│  STAGE 3: SERVER API (Express Middleware)              │
│  Responsible for:                                       │
│  • Phone → E.164 conversion                            │
│  • Email → lowercase + validation                      │
│  • ZIP → 5 digits                                      │
│  • Custom business logic                               │
│  Tool: middleware/serialization.ts + utils/serializers.ts │
└────────────────────┬────────────────────────────────────┘
                     ↓ (Already normalized)
┌─────────────────────────────────────────────────────────┐
│  STAGE 4: DATABASE (Mongoose)                          │
│  Responsible for:                                       │
│  • Date ↔ ISODate conversion                          │
│  • ObjectId conversion                                 │
│  • trim/lowercase/uppercase                            │
│  • Type validation                                     │
│  • Schema enforcement                                  │
│  Tool: models/*.ts (Mongoose schemas)                  │
└─────────────────────────────────────────────────────────┘
```

**Both layers work together:**
- Stage 3: Business logic normalization (phone, email, etc.)
- Stage 4: Type conversion and storage (Date, ObjectId, text options)

---

## ✅ Example: Complete Lead Save

```javascript
// CLIENT sends
{
  fName: "  John  ",
  email: "John@Example.com",
  phone: "(713) 555-1234",
  deliveryDate: new Date("2026-01-08")
}

// STAGE 2: Client Axios interceptor
{
  fName: "  John  ",          // No change yet
  email: "john@example.com",  // ← Lowercased
  phone: "+17135551234",      // ← E.164 format
  deliveryDate: "2026-01-08T00:00:00.000Z"  // ← ISO string
}

// STAGE 3: Server Express middleware
{
  fName: "John",              // ← Trimmed
  email: "john@example.com",  // ← Already lowercase
  phone: "+17135551234",      // ← Already E.164
  deliveryDate: Date object   // ← Converted back to Date
}

// STAGE 4: Mongoose schema
{
  fName: "John",              // ← trim: true applied (backup)
  email: "john@example.com",  // ← lowercase: true applied (backup)
  phone: "+17135551234",      // ← Just stored as String
  deliveryDate: ISODate(...)  // ← Date → ISODate conversion ✅
}

// STORED IN MONGODB
{
  _id: ObjectId("507f..."),
  fName: "John",
  email: "john@example.com",
  phone: "+17135551234",
  deliveryDate: ISODate("2026-01-08T00:00:00.000Z"),
  createdAt: ISODate("2026-01-08T12:34:56.789Z"),
  updatedAt: ISODate("2026-01-08T12:34:56.789Z")
}
```

---

## 🎓 Conclusion

**For phone numbers:**
- ❌ Mongoose does NOT automatically convert formats
- ✅ Conversion happens in Express middleware (Stage 3)
- ✅ Mongoose only stores the string (with trim if specified)

**For dates:**
- ✅ Mongoose DOES automatically convert
- ✅ Date object ↔ ISODate conversion is built-in
- ✅ No middleware needed for date conversion

**Architecture:**
- **Stage 3 (Middleware)**: Business logic serialization (phone, email, etc.)
- **Stage 4 (Mongoose)**: Type conversion serialization (Date, ObjectId, text options)

Both layers provide "serialization" but for different purposes! 🎯

