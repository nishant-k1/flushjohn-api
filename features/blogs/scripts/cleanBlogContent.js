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
    "🧹 Cleaning blog content - removing HTML code block wrappers..."
  );

  await dbConnect();

  const connected = await waitForConnection(15000);
  if (!connected) {
    throw new Error("Database connection timeout");
  }
  try {
    const blogsWithCodeBlocks = await Blogs.find({
      $or: [
        { content: { $regex: /```html/ } },
        { excerpt: { $regex: /```html/ } },
      ],
    });


    let cleanedCount = 0;

    for (const blog of blogsWithCodeBlocks) {
      let needsUpdate = false;

      if (blog.content && blog.content.includes("```html")) {
        blog.content = blog.content
          .replace(/```html\n?/g, "") // Remove opening ```html
          .replace(/```\n?$/g, "") // Remove closing ```
          .trim();
        needsUpdate = true;
      }

      if (blog.excerpt && blog.excerpt.includes("```html")) {
        blog.excerpt = blog.excerpt
          .replace(/```html\n?/g, "") // Remove opening ```html
          .replace(/```\n?$/g, "") // Remove closing ```
          .trim();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await blog.save();
        cleanedCount++;
      }
    }

  } catch (error) {
    console.error("💥 Error during content cleaning:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cleanBlogContent()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Blog content cleaning failed:", error);
      process.exit(1);
    });
}

export default cleanBlogContent;
