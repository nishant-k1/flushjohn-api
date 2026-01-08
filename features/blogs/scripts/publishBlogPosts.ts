/**
 * Publish Generated Blog Posts to Database
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs/promises";
import path from "path";
import * as blogsService from "../services/blogsService.js";
import { dbConnect, waitForConnection } from "../../../lib/dbConnect.js";

async function publishBlogPosts() {
  await dbConnect();

  const connected = await waitForConnection(15000); // Wait up to 15 seconds
  if (!connected) {
    throw new Error("Database connection timeout");
  }
  const generatedBlogsDir = path.join(process.cwd(), "generated-blogs");

  try {
    const files = await fs.readdir(generatedBlogsDir);
    const blogFiles = files.filter(
      (file) => file.startsWith("blog-") && file.endsWith(".json")
    );
    const results = [];

    for (let i = 0; i < blogFiles.length; i++) {
      const file = blogFiles[i];
      const filePath = path.join(generatedBlogsDir, file);

      try {
        const blogData = JSON.parse(await fs.readFile(filePath, "utf8"));

        const createdBlog = await blogsService.createBlog(blogData);
        results.push({
          success: true,
          title: blogData.title,
          slug: blogData.slug,
          blogId: createdBlog._id,
          filename: file,
        });
      } catch (error) {
        console.error(`❌ Failed to publish ${file}:`, error.message);
        results.push({
          success: false,
          filename: file,
          error: error.message,
        });
      }

      if (i < blogFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    if (successful.length > 0) {
      successful.forEach((result, index) => {});
    }

    if (failed.length > 0) {
      failed.forEach((result, index) => {});
    }
    return results;
  } catch (error) {
    console.error("💥 Error during publishing:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  publishBlogPosts()
    .then((results) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Publishing failed:", error);
      process.exit(1);
    });
}

export default publishBlogPosts;
