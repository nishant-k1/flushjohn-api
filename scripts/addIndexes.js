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

    // Add indexes to Leads collection
    console.log("📊 Adding indexes to Leads collection...");
    await createIndexSafe(
      db.collection("leads"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(db.collection("leads"), { email: 1 }, "email_1");
    await createIndexSafe(db.collection("leads"), { phone: 1 }, "phone_1");
    await createIndexSafe(db.collection("leads"), { leadNo: -1 }, "leadNo_-1");
    await createIndexSafe(
      db.collection("leads"),
      { leadStatus: 1 },
      "leadStatus_1"
    );
    await createIndexSafe(
      db.collection("leads"),
      { leadSource: 1 },
      "leadSource_1"
    );
    await createIndexSafe(
      db.collection("leads"),
      { usageType: 1 },
      "usageType_1"
    );
    await createIndexSafe(db.collection("leads"), { zip: 1 }, "zip_1");
    await createIndexSafe(db.collection("leads"), { state: 1 }, "state_1");
    // Compound index for common queries
    await createIndexSafe(
      db.collection("leads"),
      { createdAt: -1, leadStatus: 1 },
      "createdAt_-1_leadStatus_1"
    );
    // Text index for search
    await createIndexSafe(
      db.collection("leads"),
      { fName: "text", lName: "text", email: "text", phone: "text", cName: "text" },
      "leads_text_search"
    );
    console.log("✅ Leads indexes added\n");

    // Add indexes to Customers collection
    console.log("📊 Adding indexes to Customers collection...");
    await createIndexSafe(
      db.collection("customers"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(
      db.collection("customers"),
      { email: 1 },
      "email_1"
    );
    await createIndexSafe(
      db.collection("customers"),
      { phone: 1 },
      "phone_1"
    );
    await createIndexSafe(
      db.collection("customers"),
      { customerNo: 1 },
      "customerNo_1"
    );
    await createIndexSafe(db.collection("customers"), { lead: 1 }, "lead_1");
    console.log("✅ Customers indexes added\n");

    // Add indexes to Vendors collection
    console.log("📊 Adding indexes to Vendors collection...");
    await createIndexSafe(
      db.collection("vendors"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(db.collection("vendors"), { email: 1 }, "email_1");
    await createIndexSafe(db.collection("vendors"), { name: 1 }, "name_1");
    await createIndexSafe(db.collection("vendors"), { state: 1 }, "state_1");
    await createIndexSafe(db.collection("vendors"), { zip: 1 }, "zip_1");
    console.log("✅ Vendors indexes added\n");

    // Add indexes to Blogs collection
    console.log("📊 Adding indexes to Blogs collection...");
    await createIndexSafe(
      db.collection("blogs"),
      { createdAt: -1 },
      "createdAt_-1"
    );
    await createIndexSafe(db.collection("blogs"), { slug: 1 }, "slug_1");
    await createIndexSafe(db.collection("blogs"), { status: 1 }, "status_1");
    await createIndexSafe(
      db.collection("blogs"),
      { createdAt: -1, status: 1 },
      "createdAt_-1_status_1"
    );
    console.log("✅ Blogs indexes added\n");

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
