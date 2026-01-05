/**
 * Migration Script: Convert string IDs to MongoDB References
 *
 * This script populates the new ObjectId reference fields from existing string fields
 * Run this once after deploying the updated models
 */

import mongoose, { FilterQuery } from "mongoose";
import { MongooseFilter } from "../types/common.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper function to safely call Mongoose find with proper typing
 */
async function findSafe<T>(
  model: { find: (filter: FilterQuery<T>) => Promise<T[]> },
  filter: FilterQuery<T>
): Promise<T[]> {
  return model.find(filter);
}

/**
 * Helper function to safely call Mongoose findOne with proper typing
 */
async function findOneSafe<T>(
  model: { findOne: (filter: FilterQuery<T>) => Promise<T | null> },
  filter: FilterQuery<T>
): Promise<T | null> {
  return model.findOne(filter);
}

dotenv.config({ path: join(__dirname, "..", ".env") });

// Import models
import Lead from "../features/leads/models/Leads.js";
import Quote from "../features/quotes/models/Quotes.js";
import SalesOrder from "../features/salesOrders/models/SalesOrders.js";
import JobOrder from "../features/jobOrders/models/JobOrders.js";
import Customer from "../features/customers/models/Customers.js";

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

  const quotesFilter: FilterQuery<{ lead?: { $exists: boolean } }> = {
    lead: { $exists: false },
  };
  const quotes = await findSafe<{ lead?: { $exists: boolean } }>(
    Quote as unknown as { find: (filter: FilterQuery<{ lead?: { $exists: boolean } }>) => Promise<typeof quotes> },
    quotesFilter
  );
  let migrated = 0;

  for (const quote of quotes) {
    try {
      // Try to find lead by leadId or leadNo
      let lead = null;

      if (quote.leadId) {
        lead = await Lead.findById(quote.leadId);
      }

      if (!lead && quote.leadNo) {
        const leadFilter: FilterQuery<{ leadNo: string }> = {
          leadNo: quote.leadNo,
        };
        lead = await findOneSafe<{ leadNo: string }>(
          Lead as unknown as { findOne: (filter: FilterQuery<{ leadNo: string }>) => Promise<typeof lead> },
          leadFilter
        );
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

  const salesOrdersFilter: FilterQuery<{ quote?: { $exists: boolean } }> = {
    quote: { $exists: false },
  };
  const salesOrders = await findSafe<{ quote?: { $exists: boolean } }>(
    SalesOrder as unknown as { find: (filter: FilterQuery<{ quote?: { $exists: boolean } }>) => Promise<typeof salesOrders> },
    salesOrdersFilter
  );
  let migrated = 0;

  for (const order of salesOrders) {
    try {
      // Find lead
      let lead = null;
      if (order.leadNo) {
        const leadFilter: FilterQuery<{ leadNo: string }> = {
          leadNo: order.leadNo,
        };
        lead = await findOneSafe<{ leadNo: string }>(
          Lead as unknown as { findOne: (filter: FilterQuery<{ leadNo: string }>) => Promise<typeof lead> },
          leadFilter
        );
      }

      if (lead) {
        order.lead = lead._id;
      }

      // Find customer if exists
      let customer = null;
      if (order.customerNo) {
        const customerFilter: FilterQuery<{ customerNo: number }> = {
          customerNo: order.customerNo,
        };
        customer = await findOneSafe<{ customerNo: number }>(
          Customer as unknown as { findOne: (filter: FilterQuery<{ customerNo: number }>) => Promise<typeof customer> },
          customerFilter
        );
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

  const filter: FilterQuery<{ salesOrder?: { $exists: boolean } }> = {
    salesOrder: { $exists: false },
  };
  const jobOrders = await findSafe<{ salesOrder?: { $exists: boolean } }>(
    JobOrder as unknown as { find: (filter: FilterQuery<{ salesOrder?: { $exists: boolean } }>) => Promise<typeof jobOrders> },
    filter
  );
  let migrated = 0;

  for (const jobOrder of jobOrders) {
    try {
      // Find sales order
      let salesOrder = null;
      if (jobOrder.salesOrderNo) {
        const salesOrderFilter: FilterQuery<{ salesOrderNo: number }> = {
          salesOrderNo: jobOrder.salesOrderNo,
        };
        salesOrder = await findOneSafe<{ salesOrderNo: number }>(
          SalesOrder as unknown as { findOne: (filter: FilterQuery<{ salesOrderNo: number }>) => Promise<typeof salesOrder> },
          salesOrderFilter
        );
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
