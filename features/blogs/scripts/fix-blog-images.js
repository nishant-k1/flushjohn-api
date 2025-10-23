#!/usr/bin/env node

/**
 * Fix Blog Images Migration Script
 *
 * This script fixes existing blogs that have blob URLs in their content
 * by cleaning up invalid URLs and ensuring proper image references.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const blogSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    coverImage: String,
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

/**
 * Clean blob URLs from content
 */
function cleanBlobUrls(content) {
  if (!content) return content;

  let cleanedContent = content.replace(/blob:http:\/\/[^"'\s]+/g, "");

  cleanedContent = cleanedContent.replace(
    /src="http:\/\/localhost:[^"'\s]*"/g,
    ""
  );

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

  if (typeof coverImage === "string" && coverImage.startsWith("blob:")) {
    return "";
  }

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

    await mongoose.connect(process.env.MONGO_DB_URI);

    const blogs = await Blog.find({});

    let updatedCount = 0;
    let skippedCount = 0;

    for (const blog of blogs) {
      let needsUpdate = false;
      const updates = {};

      if (blog.content) {
        const cleanedContent = cleanBlobUrls(blog.content);
        if (cleanedContent !== blog.content) {
          updates.content = cleanedContent;
          needsUpdate = true;
        }
      }

      if (blog.coverImage) {
        const cleanedCoverImage = cleanCoverImage(blog.coverImage);
        if (cleanedCoverImage !== blog.coverImage) {
          updates.coverImage = cleanedCoverImage;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Blog.findByIdAndUpdate(blog._id, updates);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

migrateBlogImages();
