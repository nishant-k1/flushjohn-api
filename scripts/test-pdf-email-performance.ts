/**
 * Performance Test Script for PDF Generation and Email Sending
 * 
 * This script tests the performance improvements made to PDF generation and email sending.
 * Run with: npx tsx scripts/test-pdf-email-performance.ts
 */

import { config } from "dotenv";
config({ path: "./.env" });

import axios from "axios";

const API_BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8080";
const TEST_QUOTE_ID = process.env.TEST_QUOTE_ID || "test-quote-id";
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || "";

// Sample quote data for testing
const sampleQuoteData = {
  quoteNo: "Q-2024-001",
  fName: "John",
  lName: "Doe",
  cName: "Test Company",
  email: "test@example.com",
  phone: "123-456-7890",
  streetAddress: "123 Test St",
  city: "Houston",
  state: "TX",
  zip: "77001",
  deliveryDate: new Date().toISOString(),
  pickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  products: [
    {
      item: "Standard Portable Restroom",
      desc: "Basic portable restroom unit",
      quantity: 5,
      rate: 150.0,
    },
    {
      item: "Deluxe Flushable Restroom",
      desc: "Premium flushable restroom unit",
      quantity: 2,
      rate: 250.0,
    },
  ],
};

interface PerformanceMetrics {
  operation: string;
  totalTime: number;
  pdfGenerationTime?: number;
  emailSendingTime?: number;
  dbUpdateTime?: number;
  timestamp: string;
}

const metrics: PerformanceMetrics[] = [];

async function testPDFGeneration() {
  console.log("\n📄 Testing PDF Generation Performance...");
  console.log("=".repeat(60));

  const iterations = 3;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${API_BASE_URL}/quotes/${TEST_QUOTE_ID}/pdf`,
        sampleQuoteData,
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
      const totalTime = Date.now() - startTime;

      times.push(totalTime);
      metrics.push({
        operation: `PDF Generation (Iteration ${i + 1})`,
        totalTime,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Iteration ${i + 1}: ${totalTime}ms`);
      if (response.data?.data?.pdfUrl) {
        console.log(`   PDF URL: ${response.data.data.pdfUrl}`);
      }

      // Wait a bit between requests to avoid overwhelming the server
      if (i < iterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`❌ Iteration ${i + 1} failed:`, error.message);
      if (error.response?.data) {
        console.error("   Error details:", error.response.data);
      }
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log("\n📊 PDF Generation Results:");
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
  }
}

async function testEmailSending() {
  console.log("\n📧 Testing Email Sending Performance...");
  console.log("=".repeat(60));

  const iterations = 3;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${API_BASE_URL}/quotes/${TEST_QUOTE_ID}/email`,
        {
          ...sampleQuoteData,
          email: "test@example.com", // Use a valid test email
        },
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 60000, // Longer timeout for email
        }
      );
      const totalTime = Date.now() - startTime;

      times.push(totalTime);
      metrics.push({
        operation: `Email Sending (Iteration ${i + 1})`,
        totalTime,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Iteration ${i + 1}: ${totalTime}ms`);
      console.log(`   Email Status: ${response.data?.data?.emailStatus || "N/A"}`);

      // Wait a bit between requests
      if (i < iterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`❌ Iteration ${i + 1} failed:`, error.message);
      if (error.response?.data) {
        console.error("   Error details:", error.response.data);
      }
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log("\n📊 Email Sending Results:");
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
  }
}

async function testBrowserPoolWarmup() {
  console.log("\n🔥 Testing Browser Pool Warmup...");
  console.log("=".repeat(60));

  // First request (cold start)
  console.log("📄 First PDF (cold start)...");
  const coldStartTime = Date.now();
  try {
    await axios.post(
      `${API_BASE_URL}/quotes/${TEST_QUOTE_ID}/pdf`,
      sampleQuoteData,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    const coldTime = Date.now() - coldStartTime;
    console.log(`   Cold start: ${coldTime}ms`);

    // Wait for browser to be pooled
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Second request (warm - should use pooled browser)
    console.log("📄 Second PDF (warm - pooled browser)...");
    const warmStartTime = Date.now();
    await axios.post(
      `${API_BASE_URL}/quotes/${TEST_QUOTE_ID}/pdf`,
      sampleQuoteData,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    const warmTime = Date.now() - warmStartTime;
    console.log(`   Warm (pooled): ${warmTime}ms`);

    const improvement = coldTime - warmTime;
    const improvementPercent = ((improvement / coldTime) * 100).toFixed(2);

    console.log("\n📊 Browser Pool Impact:");
    console.log(`   Improvement: ${improvement}ms (${improvementPercent}%)`);
    console.log(
      `   ${improvement > 0 ? "✅" : "⚠️"} Browser pooling ${
        improvement > 0 ? "working" : "may not be optimal"
      }`
    );
  } catch (error: any) {
    console.error("❌ Browser pool test failed:", error.message);
  }
}

async function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📈 PERFORMANCE TEST REPORT");
  console.log("=".repeat(60));

  if (metrics.length === 0) {
    console.log("No metrics collected.");
    return;
  }

  const pdfMetrics = metrics.filter((m) => m.operation.includes("PDF"));
  const emailMetrics = metrics.filter((m) => m.operation.includes("Email"));

  if (pdfMetrics.length > 0) {
    const avgPDF = pdfMetrics.reduce((a, b) => a + b.totalTime, 0) / pdfMetrics.length;
    console.log(`\n📄 PDF Generation:`);
    console.log(`   Average: ${avgPDF.toFixed(2)}ms`);
    console.log(`   Total tests: ${pdfMetrics.length}`);
  }

  if (emailMetrics.length > 0) {
    const avgEmail = emailMetrics.reduce((a, b) => a + b.totalTime, 0) / emailMetrics.length;
    console.log(`\n📧 Email Sending:`);
    console.log(`   Average: ${avgEmail.toFixed(2)}ms`);
    console.log(`   Total tests: ${emailMetrics.length}`);
  }

  console.log("\n🎯 Expected Improvements:");
  console.log("   - PDF Generation: 20-30% faster (~300-500ms saved)");
  console.log("   - Email Sending: 15-25% faster (~100-300ms saved)");
  console.log("   - API Response: 30-50% faster (~150-300ms saved)");

  console.log("\n" + "=".repeat(60));
}

async function main() {
  console.log("🚀 PDF & Email Performance Test Suite");
  console.log("=".repeat(60));
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Test Quote ID: ${TEST_QUOTE_ID}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? "✅ Set" : "❌ Missing"}`);

  if (!AUTH_TOKEN) {
    console.warn("\n⚠️  WARNING: AUTH_TOKEN not set. Tests may fail.");
    console.warn("   Set TEST_AUTH_TOKEN environment variable or update .env file");
  }

  try {
    // Test browser pool warmup
    await testBrowserPoolWarmup();

    // Test PDF generation
    await testPDFGeneration();

    // Test email sending (optional - requires valid email config)
    const testEmail = process.env.TEST_EMAIL_SENDING === "true";
    if (testEmail) {
      await testEmailSending();
    } else {
      console.log("\n📧 Email sending test skipped (set TEST_EMAIL_SENDING=true to enable)");
    }

    // Generate report
    await generateReport();
  } catch (error: any) {
    console.error("\n❌ Test suite failed:", error.message);
    if (error.response?.data) {
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }

  console.log("\n✅ Performance tests completed!");
}

// Run tests if script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { testPDFGeneration, testEmailSending, testBrowserPoolWarmup };
