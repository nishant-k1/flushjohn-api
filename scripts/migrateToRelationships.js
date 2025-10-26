/**
 * Migration Script: Convert string IDs to MongoDB References
 *
 * This script populates the new ObjectId reference fields from existing string fields
 * Run this once after deploying the updated models
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

// Import models
import Lead from "../features/leads/models/Leads/index.js";
import Quote from "../features/quotes/models/Quotes/index.js";
import SalesOrder from "../features/salesOrders/models/SalesOrders/index.js";
import JobOrder from "../features/jobOrders/models/JobOrders/index.js";
import Customer from "../features/customers/models/Customers/index.js";

/**
 * Connect to database
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Migrate Quotes to use Lead references
 */
const migrateQuotes = async () => {
  console.log("\n📋 Migrating Quotes...");

  const quotes = await Quote.find({ lead: { $exists: false } });
  let migrated = 0;

  for (const quote of quotes) {
    try {
      // Try to find lead by leadId or leadNo
      let lead = null;

      if (quote.leadId) {
        lead = await Lead.findById(quote.leadId);
      }

      if (!lead && quote.leadNo) {
        lead = await Lead.findOne({ leadNo: quote.leadNo });
      }

      if (lead) {
        quote.lead = lead._id;
        await quote.save();
        migrated++;
      }
    } catch (error) {
      console.error(`Error migrating quote ${quote._id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${migrated} of ${quotes.length} quotes`);
};

/**
 * Migrate Sales Orders to use Quote and Lead references
 */
const migrateSalesOrders = async () => {
  console.log("\n📋 Migrating Sales Orders...");

  const salesOrders = await SalesOrder.find({ quote: { $exists: false } });
  let migrated = 0;

  for (const order of salesOrders) {
    try {
      // Find lead
      let lead = null;
      if (order.leadNo) {
        lead = await Lead.findOne({ leadNo: order.leadNo });
      }

      if (lead) {
        order.lead = lead._id;
      }

      // Find customer if exists
      let customer = null;
      if (order.customerNo) {
        customer = await Customer.findOne({ customerNo: order.customerNo });
      }

      if (customer) {
        order.customer = customer._id;
      }

      await order.save();
      migrated++;
    } catch (error) {
      console.error(`Error migrating sales order ${order._id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${migrated} of ${salesOrders.length} sales orders`);
};

/**
 * Migrate Job Orders to use Sales Order and Lead references
 */
const migrateJobOrders = async () => {
  console.log("\n📋 Migrating Job Orders...");

  const jobOrders = await JobOrder.find({ salesOrder: { $exists: false } });
  let migrated = 0;

  for (const jobOrder of jobOrders) {
    try {
      // Find sales order
      let salesOrder = null;
      if (jobOrder.salesOrderNo) {
        salesOrder = await SalesOrder.findOne({
          salesOrderNo: jobOrder.salesOrderNo,
        });
      }

      if (salesOrder) {
        jobOrder.salesOrder = salesOrder._id;
        jobOrder.lead = salesOrder.lead;
        jobOrder.customer = salesOrder.customer;
      }

      await jobOrder.save();
      migrated++;
    } catch (error) {
      console.error(
        `Error migrating job order ${jobOrder._id}:`,
        error.message
      );
    }
  }

  console.log(`✅ Migrated ${migrated} of ${jobOrders.length} job orders`);
};

/**
 * Main migration function
 */
const runMigration = async () => {
  try {
    await connectDB();

    console.log("\n🚀 Starting migration to MongoDB relationships...\n");

    await migrateQuotes();
    await migrateSalesOrders();
    await migrateJobOrders();

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Test your application");
    console.log("2. Monitor for any issues");
    console.log(
      "3. After confirming everything works, you can update services to use new references"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
};

// Run migration
runMigration();
