/**
 * Comprehensive API Testing Script
 * Tests all endpoints and reports failures
 */

import axios, { AxiosError } from "axios";
import { config } from "dotenv";

config({ path: "./.env" });

const BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const TEST_USER_ID = process.env.TEST_USER_ID || "testadmin";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "TestAdmin123!@#";

interface TestResult {
  method: string;
  endpoint: string;
  status: "PASS" | "FAIL" | "SKIP";
  statusCode?: number;
  error?: string;
  message?: string;
}

const results: TestResult[] = [];
let authToken: string | null = null;
let csrfToken: string | null = null;
let sessionId: string = `test-session-${Date.now()}`;
let testUserId: string | null = null;
let testLeadId: string | null = null;
let testQuoteId: string | null = null;
let testCustomerId: string | null = null;
let testSalesOrderId: string | null = null;
let testJobOrderId: string | null = null;
let testVendorId: string | null = null;
let testBlogId: string | null = null;
let testContactId: string | null = null;
let testPaymentId: string | null = null;
let testNotificationId: string | null = null;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  validateStatus: () => true, // Don't throw on any status code
});

// Get CSRF token from a GET request
async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await axiosInstance.get("/", {
      headers: {
        "X-Session-ID": sessionId,
      },
    });
    return response.headers["x-csrf-token"] || null;
  } catch {
    return null;
  }
}

// Helper function to make requests
async function makeRequest(
  method: string,
  endpoint: string,
  data?: any,
  requiresAuth = true,
  customHeaders: Record<string, string> = {},
  skipCsrf = false
): Promise<TestResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Session-ID": sessionId,
    ...customHeaders,
  };

  if (requiresAuth && authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Add CSRF token for state-changing requests
  const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (stateChangingMethods.includes(method) && !skipCsrf && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  try {
    const response = await axiosInstance({
      method,
      url: endpoint,
      data,
      headers,
    });

    // Extract CSRF token from response if present
    if (response.headers["x-csrf-token"]) {
      csrfToken = response.headers["x-csrf-token"];
    }

    const isSuccess = response.status >= 200 && response.status < 300;

    return {
      method,
      endpoint,
      status: isSuccess ? "PASS" : "FAIL",
      statusCode: response.status,
      error: isSuccess
        ? undefined
        : `Status ${response.status}: ${JSON.stringify(response.data).substring(
            0,
            200
          )}`,
      message: isSuccess ? "Success" : undefined,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      method,
      endpoint,
      status: "FAIL",
      statusCode: axiosError.response?.status,
      error: axiosError.message || "Request failed",
    };
  }
}

// Test authentication first
async function testAuthentication(): Promise<boolean> {
  console.log("🔐 Testing authentication...");

  // Get CSRF token first
  csrfToken = await getCsrfToken();

  // Try to login (auth endpoint skips CSRF)
  try {
    const response = await axiosInstance.post(
      "/auth",
      {
        userId: TEST_USER_ID,
        password: TEST_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
      }
    );

    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      // Update session ID to user ID if available
      if (response.data.user?.userId) {
        sessionId = response.data.user.userId;
      }
      // Get new CSRF token after login
      csrfToken = await getCsrfToken();
      console.log("✅ Authentication successful");
      results.push({
        method: "POST",
        endpoint: "/auth",
        status: "PASS",
        statusCode: 200,
        message: "Authentication successful",
      });
      return true;
    } else {
      results.push({
        method: "POST",
        endpoint: "/auth",
        status: "FAIL",
        statusCode: response.status,
        error: `Status ${response.status}: ${JSON.stringify(
          response.data
        ).substring(0, 200)}`,
      });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    results.push({
      method: "POST",
      endpoint: "/auth",
      status: "FAIL",
      statusCode: axiosError.response?.status,
      error: axiosError.message || "Authentication failed",
    });
  }

  console.log("❌ Authentication failed - some tests will be skipped");
  return false;
}

// Test all endpoints
async function runTests() {
  console.log(`\n🧪 Starting API Tests against ${BASE_URL}\n`);
  console.log("=".repeat(60));

  // 1. Root endpoint
  console.log("\n📌 Testing Root Endpoints...");
  results.push(await makeRequest("GET", "/", undefined, false));

  // 2. Authentication
  const authSuccess = await testAuthentication();

  // 3. Auth endpoints
  console.log("\n📌 Testing Auth Endpoints...");
  if (authToken) {
    results.push(await makeRequest("GET", "/auth/verify", undefined, true));
  }
  results.push(await makeRequest("POST", "/auth/logout", undefined, true));

  // 4. Users endpoints (Admin only - may fail if not admin)
  console.log("\n📌 Testing Users Endpoints...");
  results.push(await makeRequest("GET", "/users", undefined, true));
  if (testUserId) {
    results.push(
      await makeRequest("GET", `/users/${testUserId}`, undefined, true)
    );
  }

  // 5. Leads endpoints
  console.log("\n📌 Testing Leads Endpoints...");
  const leadData = {
    fName: "Test",
    lName: "Lead",
    email: `test${Date.now()}@example.com`,
    phone: "1234567890",
    status: "New",
    usageType: "Event", // Required field
    streetAddress: "123 Test St",
    city: "Houston",
    state: "TX",
    zip: "77001",
  };
  const createLeadResult = await makeRequest(
    "POST",
    "/leads",
    leadData,
    false,
    {},
    true
  ); // Skip CSRF for public endpoint
  results.push(createLeadResult);

  if (createLeadResult.status === "PASS") {
    try {
      const response = await axiosInstance.post("/leads", leadData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.data?._id) {
        testLeadId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/leads", undefined, true));
  if (testLeadId) {
    results.push(
      await makeRequest("GET", `/leads/${testLeadId}`, undefined, true)
    );
    results.push(
      await makeRequest(
        "PUT",
        `/leads/${testLeadId}`,
        { status: "Contacted" },
        true
      )
    );
  }

  // 6. Quotes endpoints
  console.log("\n📌 Testing Quotes Endpoints...");
  const quoteData = {
    quoteNo: `QT-${Date.now()}`,
    lead: testLeadId || "507f1f77bcf86cd799439011",
    products: [],
    totalAmount: 1000,
    usageType: "Event", // Required field
    email: `quote${Date.now()}@example.com`,
  };
  const createQuoteResult = await makeRequest(
    "POST",
    "/quotes",
    quoteData,
    true
  );
  results.push(createQuoteResult);

  if (createQuoteResult.status === "PASS") {
    try {
      const response = await axiosInstance.post("/quotes", quoteData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.data.data?._id) {
        testQuoteId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/quotes", undefined, true));
  results.push(
    await makeRequest(
      "GET",
      "/quotes/ai-suggested-rate?zipCode=77001&productItem=Portable%20Toilet",
      undefined,
      true
    )
  );
  if (testQuoteId) {
    results.push(
      await makeRequest("GET", `/quotes/${testQuoteId}`, undefined, true)
    );
    results.push(
      await makeRequest(
        "PUT",
        `/quotes/${testQuoteId}`,
        { totalAmount: 1200 },
        true
      )
    );
  }

  // 7. Customers endpoints
  console.log("\n📌 Testing Customers Endpoints...");
  const customerData = {
    customerNo: `CUST-${Date.now()}`,
    fName: "Test",
    lName: "Customer",
    email: `customer${Date.now()}@example.com`,
    phone: "1234567890",
  };
  const createCustomerResult = await makeRequest(
    "POST",
    "/customers",
    customerData,
    true
  );
  results.push(createCustomerResult);

  if (createCustomerResult.status === "PASS") {
    try {
      const response = await axiosInstance.post("/customers", customerData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.data.data?._id) {
        testCustomerId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/customers", undefined, true));
  if (testCustomerId) {
    results.push(
      await makeRequest("GET", `/customers/${testCustomerId}`, undefined, true)
    );
    results.push(
      await makeRequest(
        "PUT",
        `/customers/${testCustomerId}`,
        { phone: "9876543210" },
        true
      )
    );
  }

  // 8. Sales Orders endpoints
  console.log("\n📌 Testing Sales Orders Endpoints...");
  const salesOrderData = {
    lead: testLeadId || "507f1f77bcf86cd799439011",
    products: [],
    totalAmount: 1500,
    email: `salesorder${Date.now()}@example.com`,
    quoteNo: `QT-${Date.now()}`, // Required field
  };
  const createSalesOrderResult = await makeRequest(
    "POST",
    "/salesOrders",
    salesOrderData,
    true
  );
  results.push(createSalesOrderResult);

  if (createSalesOrderResult.status === "PASS") {
    try {
      const response = await axiosInstance.post(
        "/salesOrders",
        salesOrderData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (response.data.data?._id) {
        testSalesOrderId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/salesOrders", undefined, true));
  if (testSalesOrderId) {
    results.push(
      await makeRequest(
        "GET",
        `/salesOrders/${testSalesOrderId}`,
        undefined,
        true
      )
    );
    results.push(
      await makeRequest(
        "PUT",
        `/salesOrders/${testSalesOrderId}`,
        { totalAmount: 1600 },
        true
      )
    );
  }

  // 9. Job Orders endpoints
  console.log("\n📌 Testing Job Orders Endpoints...");
  // Get sales order number from created sales order (must be numeric)
  let salesOrderNo: number | undefined = undefined;
  if (testSalesOrderId) {
    try {
      const response = await axiosInstance.get(
        `/salesOrders/${testSalesOrderId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "X-Session-ID": sessionId,
          },
        }
      );
      if (response.data.data?.salesOrderNo) {
        salesOrderNo =
          typeof response.data.data.salesOrderNo === "number"
            ? response.data.data.salesOrderNo
            : parseInt(response.data.data.salesOrderNo);
      }
    } catch {}
  }

  // Get current date and add 7 days for delivery date, 8 days for pickup
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 8);

  const jobOrderData = {
    salesOrder: testSalesOrderId || "507f1f77bcf86cd799439011",
    products: [],
    totalAmount: 1400,
    salesOrderNo: salesOrderNo || 1000, // Required field - must be numeric
    contactPersonName: "Test Contact Person", // Required field
    contactPersonPhone: "1234567890", // Required field
    fName: "Test", // Required field
    email: `joborder${Date.now()}@example.com`, // Required field
    phone: "1234567890", // Required field
    streetAddress: "123 Test St", // Required field
    city: "Houston", // Required field
    state: "TX", // Required field
    zip: "77001", // Required field
    deliveryDate: deliveryDate.toISOString().split("T")[0], // Required field (YYYY-MM-DD format)
    pickupDate: pickupDate.toISOString().split("T")[0], // Required field (YYYY-MM-DD format)
    usageType: "Event", // Required field
  };
  const createJobOrderResult = await makeRequest(
    "POST",
    "/jobOrders",
    jobOrderData,
    true
  );
  results.push(createJobOrderResult);

  if (createJobOrderResult.status === "PASS") {
    try {
      const response = await axiosInstance.post("/jobOrders", jobOrderData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.data.data?._id) {
        testJobOrderId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/jobOrders", undefined, true));
  if (testJobOrderId) {
    results.push(
      await makeRequest("GET", `/jobOrders/${testJobOrderId}`, undefined, true)
    );
    results.push(
      await makeRequest(
        "PUT",
        `/jobOrders/${testJobOrderId}`,
        { totalAmount: 1500 },
        true
      )
    );
  }

  // 10. Vendors endpoints
  console.log("\n📌 Testing Vendors Endpoints...");
  const vendorData = {
    name: `Test Vendor ${Date.now()}`,
    email: `vendor${Date.now()}@example.com`,
    phone: "1234567890",
  };
  const createVendorResult = await makeRequest(
    "POST",
    "/vendors",
    vendorData,
    true
  );
  results.push(createVendorResult);

  if (createVendorResult.status === "PASS") {
    try {
      const response = await axiosInstance.post("/vendors", vendorData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.data.data?._id) {
        testVendorId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/vendors", undefined, true));
  if (testVendorId) {
    results.push(
      await makeRequest("GET", `/vendors/${testVendorId}`, undefined, true)
    );
    results.push(
      await makeRequest(
        "PUT",
        `/vendors/${testVendorId}`,
        { phone: "9876543210" },
        true
      )
    );
  }

  // 11. Blogs endpoints
  console.log("\n📌 Testing Blogs Endpoints...");
  const blogData = {
    title: `Test Blog ${Date.now()}`,
    slug: `test-blog-${Date.now()}`,
    content:
      "This is a test blog content that is at least 50 characters long to pass validation requirements.",
    status: "draft",
  };
  const createBlogResult = await makeRequest("POST", "/blogs", blogData, false);
  results.push(createBlogResult);

  if (createBlogResult.status === "PASS") {
    try {
      const response = await axiosInstance.post("/blogs", blogData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.data?._id) {
        testBlogId = response.data.data._id;
      }
    } catch {}
  }

  results.push(await makeRequest("GET", "/blogs", undefined, false));
  if (testBlogId) {
    results.push(
      await makeRequest("GET", `/blogs/${testBlogId}`, undefined, false)
    );
    results.push(
      await makeRequest(
        "PUT",
        `/blogs/${testBlogId}`,
        { status: "published" },
        false
      )
    );
  }

  // 12. Blog Automation endpoints
  console.log("\n📌 Testing Blog Automation Endpoints...");
  results.push(
    await makeRequest("GET", "/blog-automation/status", undefined, true)
  );
  results.push(
    await makeRequest("GET", "/blog-automation/stats", undefined, true)
  );
  results.push(
    await makeRequest("GET", "/blog-automation/calendar", undefined, true)
  );

  // 13. Notes endpoints
  console.log("\n📌 Testing Notes Endpoints...");
  results.push(await makeRequest("GET", "/notes", undefined, true));
  results.push(
    await makeRequest(
      "POST",
      "/notes/save",
      { content: "Test notes content" },
      true
    )
  );

  // 14. Contacts endpoints
  console.log("\n📌 Testing Contacts Endpoints...");
  results.push(await makeRequest("GET", "/contacts", undefined, true));

  // 15. Sales Assist endpoints
  console.log("\n📌 Testing Sales Assist Endpoints...");
  results.push(
    await makeRequest(
      "POST",
      "/sales-assist/analyze",
      {
        transcript: "Hello, I need portable toilets for an event.",
        context: {},
      },
      true
    )
  );
  results.push(
    await makeRequest(
      "GET",
      "/sales-assist/pricing?zipCode=77001&productItem=Portable%20Toilet",
      undefined,
      true
    )
  );
  results.push(
    await makeRequest("GET", "/sales-assist/speech/status", undefined, true)
  );

  // 16. Notifications endpoints
  console.log("\n📌 Testing Notifications Endpoints...");
  results.push(await makeRequest("GET", "/notifications", undefined, true));
  results.push(
    await makeRequest("GET", "/notifications/unread-count", undefined, true)
  );

  // 17. Payments endpoints
  console.log("\n📌 Testing Payments Endpoints...");
  if (testSalesOrderId) {
    results.push(
      await makeRequest(
        "POST",
        `/payments/sales-orders/${testSalesOrderId}/create-payment-link`,
        {
          returnUrl: "http://localhost:3000",
        },
        true
      )
    );
    results.push(
      await makeRequest(
        "GET",
        `/payments/sales-orders/${testSalesOrderId}`,
        undefined,
        true
      )
    );
  }

  // 18. File Upload endpoints
  console.log("\n📌 Testing File Upload Endpoints...");
  results.push(
    await makeRequest(
      "POST",
      "/file-upload",
      {
        name: "test-image.jpg",
        type: "image/jpeg",
      },
      true
    )
  );

  // 19. PDF Access endpoints
  console.log("\n📌 Testing PDF Access Endpoints...");
  if (testQuoteId) {
    results.push(
      await makeRequest("GET", `/pdf/quote/${testQuoteId}`, undefined, true)
    );
    results.push(
      await makeRequest(
        "GET",
        `/pdf/generate-url/quote/${testQuoteId}`,
        undefined,
        true
      )
    );
  }

  // 20. S3 CORS endpoints
  console.log("\n📌 Testing S3 CORS Endpoints...");
  results.push(await makeRequest("GET", "/s3-cors", undefined, false));

  // 21. Contact endpoint
  console.log("\n📌 Testing Contact Endpoint...");
  // Contact endpoint requires CSRF but is public - need to get token first
  if (!csrfToken) {
    csrfToken = await getCsrfToken();
  }
  results.push(
    await makeRequest(
      "POST",
      "/contact",
      {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        message: "Test message",
      },
      false
    )
  );

  // Generate report
  generateReport();
}

function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${results.length}`);

  if (failed > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("❌ FAILING ENDPOINTS:");
    console.log("=".repeat(60));

    const failingEndpoints = results.filter((r) => r.status === "FAIL");
    failingEndpoints.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.method} ${result.endpoint}`);
      console.log(`   Status Code: ${result.statusCode || "N/A"}`);
      console.log(`   Error: ${result.error || "Unknown error"}`);
    });
  }

  console.log("\n" + "=".repeat(60));
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  process.exit(1);
});
