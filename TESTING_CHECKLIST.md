# Testing Checklist for Security Fixes

## ✅ Quick Test Guide

### 1. Test API Authentication

#### Test Without Token (Should Fail)

```bash
# Test leads endpoint without auth
curl http://localhost:8080/leads

# Expected: 401 Unauthorized
# Response: {"success":false,"message":"Authentication required...","error":"UNAUTHORIZED"}
```

#### Test With Token (Should Work)

```bash
# First, login to get token
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"your_user","password":"your_password"}'

# Use token in Authorization header
curl http://localhost:8080/leads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: 200 OK with leads data
```

---

### 2. Test Deletion Protection

#### Scenario A: Delete Lead With Related Records (Should Fail)

```bash
# 1. Create a lead
curl -X POST http://localhost:8080/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fName": "Test",
    "lName": "Lead",
    "email": "test@example.com",
    "phone": "1234567890",
    "usageType": "Event"
  }'

# 2. Create a quote from that lead
curl -X POST http://localhost:8080/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadNo": "LEAD_NUMBER_FROM_STEP_1",
    "fName": "Test",
    "lName": "Lead",
    "email": "test@example.com",
    "phone": "1234567890",
    "usageType": "Event"
  }'

# 3. Try to delete the lead (Should FAIL)
curl -X DELETE http://localhost:8080/leads/LEAD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 403 Forbidden
# Response: {
#   "success": false,
#   "message": "Cannot delete lead. Related records exist: 1 quote(s)...",
#   "error": "DELETION_BLOCKED",
#   "details": {"quotesCount": 1, "salesOrdersCount": 0, "jobOrdersCount": 0}
# }
```

#### Scenario B: Delete Lead Without Related Records (Should Succeed)

```bash
# 1. Create a lead without quotes/sales orders
curl -X POST http://localhost:8080/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fName": "Clean",
    "lName": "Lead",
    "email": "clean@example.com",
    "phone": "1234567890",
    "usageType": "Event"
  }'

# 2. Delete the lead (Should SUCCEED)
curl -X DELETE http://localhost:8080/leads/LEAD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK
# Response: {
#   "success": true,
#   "message": "Lead deleted successfully",
#   "data": {"_id": "..."}
# }
```

---

### 3. Test Unique Constraints

#### Test Duplicate Quote Numbers (Should Fail)

```bash
# 1. Create first quote
curl -X POST http://localhost:8080/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNo": 1000,
    "fName": "Test",
    "lName": "Customer",
    "email": "test@example.com",
    "phone": "1234567890",
    "usageType": "Event"
  }'

# 2. Try to create second quote with same number (Should FAIL)
curl -X POST http://localhost:8080/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quoteNo": 1000,
    "fName": "Another",
    "lName": "Customer",
    "email": "another@example.com",
    "phone": "9876543210",
    "usageType": "Event"
  }'

# Expected: Error from MongoDB about duplicate key
```

---

### 4. Test Frontend Changes

#### In Browser Console:

```javascript
// Test authentication error
fetch("http://localhost:8080/leads")
  .then((r) => r.json())
  .then(console.log);
// Expected: {success: false, error: "UNAUTHORIZED"}

// Test with token
fetch("http://localhost:8080/leads", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
  },
})
  .then((r) => r.json())
  .then(console.log);
// Expected: Success with leads data
```

#### UI Testing:

1. ✅ Open CRM app in browser
2. ✅ Login successfully
3. ✅ Navigate to Leads page
4. ✅ Try to delete a lead WITHOUT related records → Should show success toast
5. ✅ Try to delete a lead WITH related records → Should show error toast with details
6. ✅ Verify table refreshes after successful deletion

---

## Automated Testing (Future)

### Unit Tests (To Add)

```javascript
// features/leads/__tests__/leadsService.test.js
describe("deleteLead", () => {
  it("should throw DeletionBlockedError when lead has quotes", async () => {
    // Create lead with quote
    // Try to delete
    // Expect DeletionBlockedError
  });

  it("should delete lead without related records", async () => {
    // Create standalone lead
    // Delete it
    // Expect success
  });
});
```

### Integration Tests (To Add)

```javascript
// features/leads/__tests__/leadsRoutes.test.js
describe("DELETE /leads/:id", () => {
  it("should return 401 without auth token", async () => {
    const response = await request(app).delete("/leads/123");
    expect(response.status).toBe(401);
  });

  it("should return 403 when lead has related records", async () => {
    // Setup lead with quote
    const response = await request(app)
      .delete("/leads/123")
      .set("Authorization", "Bearer valid-token");
    expect(response.status).toBe(403);
  });
});
```

---

## Test Results Tracking

- [ ] API authentication test passed
- [ ] Deletion protection test passed
- [ ] Unique constraints test passed
- [ ] Frontend error handling test passed
- [ ] Frontend success feedback test passed
- [ ] Table refresh after deletion test passed

---

## Common Issues & Solutions

### Issue: Getting 401 on all requests

**Solution:** Make sure you're including the Authorization header with Bearer token

### Issue: Deletion not blocked when it should be

**Solution:** Check if leadId or leadNo match correctly in database

### Issue: Frontend not showing error toast

**Solution:** Check browser console for errors, verify showToast is imported

### Issue: Duplicate key error on valid numbers

**Solution:** Check MongoDB for existing records with same numbers

---

## Post-Testing Notes

- Test all functionality works as expected
- Check server logs for any errors
- Verify frontend displays correct messages
- Confirm no orphaned records created
- Check database constraints are enforced
