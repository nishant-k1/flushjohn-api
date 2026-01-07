/**
 * Migration Script: qty to quantity
 *
 * This script migrates all existing data from `qty` field to `quantity` field
 * in products arrays across all collections:
 * - SalesOrders
 * - Leads
 * - Quotes
 * - JobOrders
 *
 * Run with: npm run migrate-qty-to-quantity
 */

import mongoose from "mongoose";
import { config } from "dotenv";

// Load environment variables
config({ path: "./.env" });

// Import models
import SalesOrders from "../features/salesOrders/models/SalesOrders.js";
import Leads from "../features/leads/models/Leads.js";
import Quotes from "../features/quotes/models/Quotes.js";
import JobOrders from "../features/jobOrders/models/JobOrders.js";

interface ProductWithQty {
  qty?: number | string;
  quantity?: number | string;
  [key: string]: any;
}

const migrateProducts = (products: any[]): any[] => {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.map((product: ProductWithQty) => {
    // If product already has quantity, keep it
    if (product.quantity !== undefined && product.quantity !== null) {
      return product;
    }

    // If product has qty but no quantity, copy qty to quantity
    if (product.qty !== undefined && product.qty !== null) {
      return {
        ...product,
        quantity: product.qty,
      };
    }

    // If neither exists, return as-is (might be empty/invalid product)
    return product;
  });
};

const migrateCollection = async (
  model: mongoose.Model<any>,
  collectionName: string
) => {
  console.log(`\n🔄 Migrating ${collectionName}...`);

  try {
    const documents = await model.find({
      products: { $exists: true, $ne: [] },
    });

    if (documents.length === 0) {
      console.log(
        `   ✅ No documents with products found in ${collectionName}`
      );
      return { updated: 0, total: 0 };
    }

    console.log(`   📊 Found ${documents.length} documents with products`);

    let updatedCount = 0;
    let totalProductsUpdated = 0;

    for (const doc of documents) {
      const originalProducts = doc.products;
      if (!Array.isArray(originalProducts) || originalProducts.length === 0) {
        continue;
      }

      // Check if any product needs migration
      const needsMigration = originalProducts.some(
        (p: ProductWithQty) =>
          p.qty !== undefined &&
          p.qty !== null &&
          (p.quantity === undefined || p.quantity === null)
      );

      if (!needsMigration) {
        continue;
      }

      // Migrate products
      const migratedProducts = migrateProducts(originalProducts);

      // Count how many products were updated
      const productsUpdated = migratedProducts.filter(
        (p: ProductWithQty, index: number) => {
          const original = originalProducts[index];
          return (
            original.qty !== undefined &&
            original.qty !== null &&
            (original.quantity === undefined || original.quantity === null)
          );
        }
      ).length;

      // Update document
      await model.updateOne(
        { _id: doc._id },
        { $set: { products: migratedProducts } }
      );

      updatedCount++;
      totalProductsUpdated += productsUpdated;
    }

    console.log(
      `   ✅ Updated ${updatedCount} documents (${totalProductsUpdated} products migrated) in ${collectionName}`
    );

    return { updated: updatedCount, total: documents.length };
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    return { updated: 0, total: 0, error: error.message };
  }
};

const main = async () => {
  console.log("🚀 Starting migration: qty → quantity\n");

  // Connect to database
  if (!process.env.MONGO_DB_URI) {
    console.error("❌ MONGO_DB_URI environment variable is required");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("✅ Connected to database\n");
  } catch (error: any) {
    console.error("❌ Failed to connect to database:", error.message);
    process.exit(1);
  }

  const results = {
    salesOrders: { updated: 0, total: 0 },
    leads: { updated: 0, total: 0 },
    quotes: { updated: 0, total: 0 },
    jobOrders: { updated: 0, total: 0 },
  };

  // Migrate each collection
  results.salesOrders = await migrateCollection(SalesOrders, "SalesOrders");
  results.leads = await migrateCollection(Leads, "Leads");
  results.quotes = await migrateCollection(Quotes, "Quotes");
  results.jobOrders = await migrateCollection(JobOrders, "JobOrders");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(50));
  console.log(
    `SalesOrders: ${results.salesOrders.updated}/${results.salesOrders.total} documents updated`
  );
  console.log(
    `Leads:       ${results.leads.updated}/${results.leads.total} documents updated`
  );
  console.log(
    `Quotes:      ${results.quotes.updated}/${results.quotes.total} documents updated`
  );
  console.log(
    `JobOrders:   ${results.jobOrders.updated}/${results.jobOrders.total} documents updated`
  );

  const totalUpdated =
    results.salesOrders.updated +
    results.leads.updated +
    results.quotes.updated +
    results.jobOrders.updated;

  console.log(`\n✅ Total: ${totalUpdated} documents migrated`);
  console.log("=".repeat(50) + "\n");

  // Close connection
  await mongoose.connection.close();
  console.log("✅ Database connection closed");
  process.exit(0);
};

// Run migration
main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
