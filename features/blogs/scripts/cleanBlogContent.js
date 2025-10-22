/**
 * Clean Blog Content - Remove HTML Code Block Wrappers
 * Removes ```html ``` and ``` ``` wrappers from blog content and excerpts
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { dbConnect, waitForConnection } from "../../../lib/dbConnect/index.js";
import mongoose from "mongoose";
import Blogs from "../models/Blogs/index.js";

async function cleanBlogContent() {
  console.log(
    "🧹 Cleaning blog content - removing HTML code block wrappers..."
  );

  // Connect to database
  console.log("🔌 Connecting to database...");
  await dbConnect();

  const connected = await waitForConnection(15000);
  if (!connected) {
    throw new Error("Database connection timeout");
  }

  console.log("✅ Database connected successfully");

  try {
    // Find all blogs with content containing ```html
    const blogsWithCodeBlocks = await Blogs.find({
      $or: [
        { content: { $regex: /```html/ } },
        { excerpt: { $regex: /```html/ } },
      ],
    });

    console.log(
      `📝 Found ${blogsWithCodeBlocks.length} blogs with code block wrappers`
    );

    let cleanedCount = 0;

    for (const blog of blogsWithCodeBlocks) {
      let needsUpdate = false;

      // Clean content
      if (blog.content && blog.content.includes("```html")) {
        blog.content = blog.content
          .replace(/```html\n?/g, "") // Remove opening ```html
          .replace(/```\n?$/g, "") // Remove closing ```
          .trim();
        needsUpdate = true;
        console.log(`✂️ Cleaned content for: ${blog.title}`);
      }

      // Clean excerpt
      if (blog.excerpt && blog.excerpt.includes("```html")) {
        blog.excerpt = blog.excerpt
          .replace(/```html\n?/g, "") // Remove opening ```html
          .replace(/```\n?$/g, "") // Remove closing ```
          .trim();
        needsUpdate = true;
        console.log(`✂️ Cleaned excerpt for: ${blog.title}`);
      }

      // Save if changes were made
      if (needsUpdate) {
        await blog.save();
        cleanedCount++;
      }
    }

    console.log(`\n✅ Cleaned ${cleanedCount} blog posts`);
    console.log("🎉 Blog content cleaning completed successfully!");
  } catch (error) {
    console.error("💥 Error during content cleaning:", error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanBlogContent()
    .then(() => {
      console.log("\n✅ Blog content cleaning completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Blog content cleaning failed:", error);
      process.exit(1);
    });
}

export default cleanBlogContent;
