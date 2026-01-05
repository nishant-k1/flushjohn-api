# CORS Error Explanation: X-Session-ID Header

## The Error

```
Access to XMLHttpRequest at 'http://localhost:8080/leads?page=1&limit=25...' 
from origin 'http://localhost:3001' has been blocked by CORS policy: 
Request header field x-session-id is not allowed by Access-Control-Allow-Headers 
in preflight response.
```

## What This Means

### CORS Preflight Request

When a browser makes a cross-origin request with certain headers (like custom headers), it first sends a **preflight request** (OPTIONS) to check if the server allows those headers.

The browser asks:
> "Can I send a request with these headers?"

The server responds with:
> "Yes, you can use these headers: Content-Type, Authorization, ..."

### The Problem

**What Happened:**
1. Frontend sends request with `X-Session-ID` header (for CSRF token generation)
2. Browser sees custom header → sends preflight OPTIONS request
3. Backend's CORS config doesn't include `X-Session-ID` in `allowedHeaders`
4. Backend responds: "These headers are allowed: Content-Type, Authorization, ..." (no X-Session-ID)
5. Browser blocks the request: "X-Session-ID is not in the allowed list!"

### Why X-Session-ID Header?

**We added this header** in the CSRF protection implementation:

```typescript
// Frontend - axiosInstance.tsx
const userId = localStorage.getItem("userId");
if (userId) {
  config.headers["X-Session-ID"] = userId;  // ← This header
}
```

This header is used by the backend to:
- Identify the session for CSRF token generation
- Store CSRF tokens per session (in-memory storage)

## The Fix

**Added to CORS `allowedHeaders`:**
- `X-Session-ID` - Used for CSRF token generation
- `X-CSRF-Token` - Used for CSRF token validation

```typescript
allowedHeaders: [
  // ... existing headers
  "X-Session-ID",      // ← Added for CSRF token generation
  "X-CSRF-Token",      // ← Added for CSRF token validation
],
```

## How CORS Preflight Works

### Simple Request (No Preflight)
- Uses standard headers only (GET, POST with standard headers)
- Browser sends request directly
- No preflight needed

### Preflight Request (Custom Headers)
- Uses custom headers (like `X-Session-ID`, `X-CSRF-Token`)
- Browser sends OPTIONS request first:
  ```
  OPTIONS /leads HTTP/1.1
  Origin: http://localhost:3001
  Access-Control-Request-Method: GET
  Access-Control-Request-Headers: x-session-id, authorization
  ```

- Server responds with allowed headers:
  ```
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: http://localhost:3001
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, ...
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID, X-CSRF-Token
  ```

- Browser checks if requested headers are in allowed list
- If yes → sends actual request
- If no → blocks request (CORS error)

## Summary

**Problem:** `X-Session-ID` header not in CORS `allowedHeaders`

**Solution:** Added `X-Session-ID` and `X-CSRF-Token` to `allowedHeaders`

**Why:** Custom headers require explicit permission in CORS configuration

**Result:** CORS preflight now allows these headers, requests succeed

