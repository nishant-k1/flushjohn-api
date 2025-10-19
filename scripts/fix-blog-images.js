#!/usr/bin/env node

/**
 * Fix Blog Images Migration Script
 *
 * This script fixes existing blogs that have blob URLs in their content
 * by cleaning up invalid URLs and ensuring proper image references.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Blog Schema (simplified for migration)
const blogSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    coverImage: String,
    // ... other fields
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

/**
 * Clean blob URLs from content
 */
function cleanBlobUrls(content) {
  if (!content) return content;

  // Remove blob URLs from content
  let cleanedContent = content.replace(/blob:http:\/\/[^"'\s]+/g, "");

  // Remove any localhost URLs that aren't actual images
  cleanedContent = cleanedContent.replace(
    /src="http:\/\/localhost:[^"'\s]*"/g,
    ""
  );

  // Remove any blog edit page URLs
  cleanedContent = cleanedContent.replace(
    /src="[^"'\s]*\/blogs-center\/blogs\/edit\/\?[^"'\s]*"/g,
    ""
  );

  return cleanedContent;
}

/**
 * Clean blob URLs from cover image
 */
function cleanCoverImage(coverImage) {
  if (!coverImage) return coverImage;

  // If it's a blob URL, clear it
  if (typeof coverImage === "string" && coverImage.startsWith("blob:")) {
    return "";
  }

  // If it's an object with src property that's a blob URL
  if (
    typeof coverImage === "object" &&
    coverImage.src &&
    coverImage.src.startsWith("blob:")
  ) {
    return "";
  }

  return coverImage;
}

/**
 * Main migration function
 */
async function migrateBlogImages() {
  try {
    console.log("🚀 Starting blog images migration...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all blogs
    const blogs = await Blog.find({});
    console.log(`📊 Found ${blogs.length} blogs to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const blog of blogs) {
      let needsUpdate = false;
      const updates = {};

      // Check and clean content
      if (blog.content) {
        const cleanedContent = cleanBlobUrls(blog.content);
        if (cleanedContent !== blog.content) {
          updates.content = cleanedContent;
          needsUpdate = true;
          console.log(`📝 Blog "${blog.title}" - Content cleaned`);
        }
      }

      // Check and clean cover image
      if (blog.coverImage) {
        const cleanedCoverImage = cleanCoverImage(blog.coverImage);
        if (cleanedCoverImage !== blog.coverImage) {
          updates.coverImage = cleanedCoverImage;
          needsUpdate = true;
          console.log(`🖼️ Blog "${blog.title}" - Cover image cleaned`);
        }
      }

      // Update blog if needed
      if (needsUpdate) {
        await Blog.findByIdAndUpdate(blog._id, updates);
        updatedCount++;
        console.log(`✅ Updated blog: "${blog.title}"`);
      } else {
        skippedCount++;
        console.log(`⏭️ Skipped blog: "${blog.title}" (no changes needed)`);
      }
    }

    console.log("\n🎉 Migration completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Total blogs processed: ${blogs.length}`);
    console.log(`   - Blogs updated: ${updatedCount}`);
    console.log(`   - Blogs skipped: ${skippedCount}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

// Run migration
migrateBlogImages();
