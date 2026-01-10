# PATCH Migration Plan: Changes Required

## ✅ **YES - Changes Needed in Both API and CRM**

However, the changes are **simple and safe**:
- ✅ **No logic changes** needed (server already supports partial updates)
- ✅ **No data structure changes** needed
- ✅ **Just HTTP method changes** (PUT → PATCH)
- ✅ **Simple find-and-replace** operation

---

## 📋 **Files That Need Changes**

### **API Side (7 files for UPDATE operations):**

1. ✅ `features/salesOrders/routes/salesOrders.ts` - Line 159
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

2. ✅ `features/jobOrders/routes/jobOrders.ts` - Line 127
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

3. ✅ `features/quotes/routes/quotes.ts` - Line 205
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

4. ✅ `features/vendors/routes/vendors.ts` - Line 101
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

5. ✅ `features/customers/routes/customers.ts` - Line 102
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

6. ✅ `features/blogs/routes/blogs.ts` - Line 133
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

7. ✅ `features/contacts/routes/contacts.ts` - Line 139
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`

8. ⚠️ `features/leads/routes/leads.ts` - Lines 185, 259
   - Change: `router.put("/:id", ...)` → `router.patch("/:id", ...)`
   - Change: `router.put("/update/:id", ...)` → `router.patch("/update/:id", ...)`

**Files to SKIP (not update operations):**
- ❌ `features/notifications/routes/notifications.ts` - Keep PUT (mark as read is action, not update)
- ❌ `features/auth/routes/users.ts` - Keep PUT (if it's user management, may need review)

---

### **CRM Side (9 files for UPDATE operations):**

1. ✅ `src/features/salesOrders/useSalesOrders.ts` - Line 95
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

2. ✅ `src/features/jobOrders/useJobOrders.ts` - Line 95
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

3. ✅ `src/features/quotes/useQuotes.ts` - Line 91
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

4. ✅ `src/features/vendors/useVendors.ts` - Line 92
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

5. ✅ `src/features/customers/useCustomers.ts` - Line 57
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

6. ✅ `src/features/blogs/useBlogs.ts` - Line 66
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

7. ✅ `src/features/contacts/useContacts.ts` - Line 62
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

8. ✅ `src/features/leads/useLeads.ts` - Line 147
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

9. ✅ `src/features/users/useUsers.ts` - Line 54
   - Change: `axiosInstance.put(...)` → `axiosInstance.patch(...)`

**Files to SKIP (not update operations):**
- ❌ `src/features/notifications/NotificationContext.tsx` - Keep PUT (mark as read is action)
- ❌ `src/hooks/useFileUpload.tsx` - Keep PUT (file upload may use PUT)

---

## 🔧 **Type of Changes**

### **API Side - Simple Route Change:**
```typescript
// Before
router.put("/:id", validateAndRecalculateProducts, async function (req, res) {

// After
router.patch("/:id", validateAndRecalculateProducts, async function (req, res) {
```

### **CRM Side - Simple HTTP Method Change:**
```typescript
// Before
const response = await axiosInstance.put(`${URL}/${id}`, data);

// After
const response = await axiosInstance.patch(`${URL}/${id}`, data);
```

---

## ⚠️ **Important Notes**

### **1. No Service Layer Changes Needed**
- ✅ All service functions (`updateSalesOrder`, `updateJobOrder`, etc.) stay the same
- ✅ They already handle partial updates correctly
- ✅ Only route definitions change

### **2. No Data Structure Changes**
- ✅ Request body format stays the same
- ✅ Response format stays the same
- ✅ Validation stays the same

### **3. Backward Compatibility**
- ⚠️ If you have external clients using PUT, they'll need to switch too
- ✅ Internal API usage (CRM) will be updated together
- ✅ If needed, you can support both PUT and PATCH temporarily

---

## 🚀 **Migration Strategy**

### **Option 1: Complete Switch (Recommended)**
1. Update all API routes from PUT to PATCH
2. Update all CRM clients from PUT to PATCH
3. Deploy both together (API + CRM)

**Pros:** Clean, consistent, aligns with standards  
**Cons:** Requires coordinated deployment

### **Option 2: Gradual Migration**
1. Support both PUT and PATCH in API (temporary)
2. Update CRM to use PATCH
3. Remove PUT support later

**Pros:** Less risky, can test incrementally  
**Cons:** More code, temporary duplication

### **Option 3: Keep Current (No Change)**
- Current implementation works correctly
- Only semantic issue (PUT vs PATCH)
- No functional problems

**Pros:** No changes needed  
**Cons:** Not following industry standard

---

## 📊 **Change Summary**

| Category | Files to Change | Lines per File | Total Changes |
|----------|----------------|----------------|---------------|
| **API Routes** | 7-8 files | 1 line each | ~8 changes |
| **CRM Hooks** | 9 files | 1 line each | ~9 changes |
| **Service Logic** | 0 files | 0 changes | ✅ None needed |
| **Data Structures** | 0 files | 0 changes | ✅ None needed |
| **Total** | **16-17 files** | **1 line each** | **~17 changes** |

---

## ✅ **Testing Checklist**

After making changes:
- [ ] Test update operations for all entities (Sales Orders, Job Orders, Quotes, etc.)
- [ ] Verify partial updates work (only send changed fields)
- [ ] Verify full updates still work (send all fields)
- [ ] Test concurrent edits (two users editing same record)
- [ ] Verify error handling still works
- [ ] Check API documentation is updated
- [ ] Verify no breaking changes for external clients (if any)

---

## 🎯 **Recommendation**

**Yes, you need to change both API and CRM, but:**

1. ✅ **Changes are minimal** - Just HTTP method (1 line per file)
2. ✅ **No logic changes** - Services already correct
3. ✅ **Low risk** - Simple find-and-replace
4. ✅ **High value** - Aligns with industry standards
5. ✅ **Can be done incrementally** - Test one entity at a time

**Suggested Approach:**
1. Start with one entity (e.g., Sales Orders)
2. Update API route → Update CRM hook → Test
3. If successful, repeat for other entities
4. Or do all at once (safer if deploying together)

---

## 💡 **Alternative: Automated Script**

You could create a simple script to do the replacements:

```bash
# API side
find features -name "*.ts" -type f -exec sed -i '' 's/router\.put("/:id",/router.patch("\/:id",/g' {} \;

# CRM side  
find src/features -name "*.ts" -type f -exec sed -i '' 's/axiosInstance\.put(/axiosInstance.patch(/g' {} \;
```

**But manual review is recommended** to ensure correct changes only.

---

## ✅ **Final Answer**

**YES, changes needed in both:**
- **API:** 7-8 route files (change `router.put` to `router.patch`)
- **CRM:** 9 hook files (change `axiosInstance.put` to `axiosInstance.patch`)
- **Total:** ~17 simple one-line changes

**But it's worth it:**
- ✅ Industry standard
- ✅ Better semantics
- ✅ Allows future optimization (send only changed fields)
- ✅ Minimal risk (no logic changes)
