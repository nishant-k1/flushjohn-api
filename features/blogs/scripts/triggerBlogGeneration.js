/**
 * Trigger Blog Generation
 * Manually triggers blog post generation for testing
 */

import dotenv from "dotenv";
dotenv.config();

import { runAutomatedBlogGeneration } from "../services/automatedBlogService.js";

async function triggerBlogGeneration() {
  console.log("🚀 Manually triggering blog generation...");
  console.log("=========================================");

  try {
    const result = await runAutomatedBlogGeneration();

    if (result.success) {
      console.log("\n✅ Blog generation completed successfully!");
      console.log("=========================================");
      console.log(`📝 Title: ${result.blogPost.title}`);
      console.log(`🔗 Slug: ${result.blogPost.slug}`);
      console.log(`📂 Category: ${result.blogPost.category}`);
      console.log(`📅 Published: ${result.blogPost.publishedAt}`);
      console.log(`⏱️  Duration: ${result.duration}ms`);

      console.log("\n🌐 Blog post is now live on your website!");
      console.log(
        `🔗 View at: https://www.flushjohn.com/blog/${result.blogPost.slug}`
      );
    } else {
      console.log("\n❌ Blog generation failed!");
      console.log("==========================");
      console.log(`Error: ${result.error}`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Timestamp: ${result.timestamp}`);
    }
  } catch (error) {
    console.error("\n💥 Blog generation crashed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Run the trigger
if (import.meta.url === `file://${process.argv[1]}`) {
  triggerBlogGeneration()
    .then(() => {
      console.log("\n✅ Blog generation trigger completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Blog generation trigger failed:", error);
      process.exit(1);
    });
}

export default triggerBlogGeneration;
