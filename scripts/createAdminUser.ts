/**
 * Script to create an admin user directly in the database
 * Usage: npm run create-admin-user
 * or: tsx scripts/createAdminUser.ts
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "..", ".env") });

import dbConnect from "../lib/dbConnect.js";
import User from "../features/auth/models/User.js";

const createAdminUser = async () => {
  try {
    // Connect to database
    await dbConnect();
    console.log("✅ Connected to database");

    // Admin user details
    const adminUser = {
      userId: "testadmin",
      email: "testadmin@flushjohn.com",
      password: "TestAdmin123!@#", // This will be hashed by the pre-save hook
      fName: "Test",
      lName: "Admin",
      role: "admin",
      isActive: true,
    };

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { userId: adminUser.userId },
        { email: adminUser.email },
      ],
    });

    if (existingUser) {
      console.log("⚠️  User already exists:");
      console.log(`   User ID: ${existingUser.userId}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Update role to admin if not already
      if (existingUser.role !== "admin") {
        existingUser.role = "admin";
        await existingUser.save();
        console.log("✅ Updated user role to admin");
      } else {
        console.log("ℹ️  User is already an admin");
      }
      process.exit(0);
    }

    // Create new admin user
    const user = new User(adminUser);
    await user.save();

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 User Details:");
    console.log(`   User ID: ${user.userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${adminUser.password}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.isActive ? "Active" : "Inactive"}`);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    if (error.code === 11000) {
      console.error("   Duplicate key error - user might already exist");
    }
    process.exit(1);
  }
};

// Run the script
createAdminUser();

