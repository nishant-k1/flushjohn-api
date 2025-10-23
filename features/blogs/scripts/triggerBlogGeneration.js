/**
 * Trigger Blog Generation
 * Manually triggers blog post generation for testing
 */

import dotenv from "dotenv";
dotenv.config();

import { runAutomatedBlogGeneration } from "../services/automatedBlogService.js";

async function triggerBlogGeneration() {

  try {
    const result = await runAutomatedBlogGeneration();

    if (result.success) {

        `🔗 View at: https://www.flushjohn.com/blog/${result.blogPost.slug}`
      );
    } else {
    }
  } catch (error) {
    console.error("\n💥 Blog generation crashed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  triggerBlogGeneration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Blog generation trigger failed:", error);
      process.exit(1);
    });
}

export default triggerBlogGeneration;
