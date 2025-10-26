/**
 * Script to add database indexes for better performance
 * Run this once to add indexes to existing collections
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env") });

async function createIndexSafe(collection, index, name) {
  try {
    await collection.createIndex(index, { name });
    return true;
  } catch (error) {
    if (error.code === 86 || error.codeName === "IndexKeySpecsConflict") {
      console.log(`  ⚠️  Index "${name}" already exists, skipping...`);
      return false;
    }
    throw error;
  }
}

async function addIndexes() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;

    // Add indexes to Quotes collection
    console.log("📊 Adding indexes to Quotes collection...");
    await createIndexSafe(
      db.collection("quotes"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(db.collection("quotes"), { email: 1 }, "email_1");
    await createIndexSafe(db.collection("quotes"), { lead: 1 }, "lead_1");
    await createIndexSafe(
      db.collection("quotes"),
      { emailStatus: 1 },
      "emailStatus_1"
    );
    await createIndexSafe(
      db.collection("quotes"),
      { createdAt: -1, emailStatus: 1 },
      "createdAt_-1_emailStatus_1"
    );
    console.log("✅ Quotes indexes added\n");

    // Add indexes to SalesOrders collection
    console.log("📊 Adding indexes to SalesOrders collection...");
    await createIndexSafe(
      db.collection("salesorders"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(
      db.collection("salesorders"),
      { email: 1 },
      "email_1"
    );
    await createIndexSafe(
      db.collection("salesorders"),
      { customer: 1 },
      "customer_1"
    );
    await createIndexSafe(db.collection("salesorders"), { lead: 1 }, "lead_1");
    await createIndexSafe(
      db.collection("salesorders"),
      { quote: 1 },
      "quote_1"
    );
    await createIndexSafe(
      db.collection("salesorders"),
      { emailStatus: 1 },
      "emailStatus_1"
    );
    await createIndexSafe(
      db.collection("salesorders"),
      { customerNo: 1 },
      "customerNo_1"
    );
    console.log("✅ SalesOrders indexes added\n");

    // Add indexes to JobOrders collection
    console.log("📊 Adding indexes to JobOrders collection...");
    await createIndexSafe(
      db.collection("joborders"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(db.collection("joborders"), { email: 1 }, "email_1");
    await createIndexSafe(
      db.collection("joborders"),
      { salesOrder: 1 },
      "salesOrder_1"
    );
    await createIndexSafe(db.collection("joborders"), { lead: 1 }, "lead_1");
    await createIndexSafe(
      db.collection("joborders"),
      { customer: 1 },
      "customer_1"
    );
    await createIndexSafe(
      db.collection("joborders"),
      { emailStatus: 1 },
      "emailStatus_1"
    );
    await createIndexSafe(
      db.collection("joborders"),
      { vendorAcceptanceStatus: 1 },
      "vendorAcceptanceStatus_1"
    );
    await createIndexSafe(
      db.collection("joborders"),
      { jobOrderNo: 1 },
      "jobOrderNo_1_index"
    );
    console.log("✅ JobOrders indexes added\n");

    console.log("🎉 All indexes added successfully!");
    console.log("\n📈 Your database queries will now be faster!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding indexes:", error.message);
    process.exit(1);
  }
}

addIndexes();
