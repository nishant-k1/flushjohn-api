/**
 * AI Blog Post Generator Script
 * Generates and publishes 20 SEO-optimized blog posts for FlushJohn
 */

import dotenv from "dotenv";
dotenv.config();

import blogGeneratorService from "../services/blogGeneratorService.js";
import blogContentData, {
  defaultCoverImages,
} from "../services/blogContentData.js";
import * as blogsService from "../services/blogsService.js";
import { getCurrentDateTime } from "../../../lib/dayjs.js";
import { dbConnect, waitForConnection } from "../../../lib/dbConnect.js";

const config = {
  apiKey: process.env.OPENAI_API_KEY,
  batchSize: 5, // Generate 5 posts at a time to avoid rate limits
  delayBetweenBatches: 30000, // 30 seconds delay between batches
};

async function generateSingleBlogPost(postData, templateType = "citySpecific") {
  try {
    const checkSlug = blogGeneratorService.generateSlug(postData.title);
    const existingBlog = await blogsService.getBlogBySlug(checkSlug);

    if (existingBlog) {
      return {
        success: false,
        title: postData.title,
        error: "Blog already exists in database",
        slug: checkSlug,
      };
    }

    const content = await blogGeneratorService.generateBlogContent(
      templateType,
      templateType === "citySpecific"
        ? [postData.title, postData.city, postData.state, postData.keywords]
        : templateType === "industryGuide"
          ? [postData.title, postData.keywords, postData.focus]
          : templateType === "caseStudy"
            ? [postData.title, postData.keywords, postData.focus]
            : [
                postData.title,
                postData.keywords,
                postData.season,
                postData.focus,
              ]
    );

    const metaDescription = await blogGeneratorService.generateMetaDescription(
      postData.title,
      content,
      postData.keywords
    );

    const slug = blogGeneratorService.generateSlug(postData.title);

    const excerpt = blogGeneratorService.generateExcerpt(content);

    const tags = blogGeneratorService.extractTags(
      postData.title,
      content,
      postData.city || null
    );

    const coverImageAlt = blogGeneratorService.generateCoverImageAlt(
      postData.title,
      postData.city || null
    );

    const coverImageUrl =
      defaultCoverImages[postData.category] || defaultCoverImages.tips;

    // Extract city and state from content if not already provided
    // This helps event/construction posts that mention cities get geo-targeting
    let extractedLocation = { city: null, state: null };
    if (!postData.city || !postData.state) {
      extractedLocation = await blogGeneratorService.extractCityAndState(
        postData.title,
        content
      );
    }

    const blogPostData = {
      title: postData.title,
      slug: slug,
      content: content,
      excerpt: excerpt,
      author: "FlushJohn Team",
      tags: tags,
      status: "published",
      category: postData.category,
      // Store city and state: use postData if available, otherwise extract from content
      city: postData.city || extractedLocation.city || null,
      state: postData.state || extractedLocation.state || null,
      coverImage: {
        src: coverImageUrl,
        alt: coverImageAlt,
      },
      publishedAt: getCurrentDateTime(),
      metaDescription: metaDescription,
      metaKeywords: [
        postData.keywords.primary,
        postData.keywords.secondary,
        postData.keywords.longTail,
      ],
      featured: false,
      views: 0,
      likes: 0,
      comments: [],
    };

    const createdBlog = await blogsService.createBlog(blogPostData);

    return {
      success: true,
      blogId: createdBlog._id,
      title: postData.title,
      slug: slug,
      wordCount: content.replace(/<[^>]*>/g, "").split(" ").length,
    };
  } catch (error) {
    console.error(
      `❌ Error generating blog post "${postData.title}":`,
      error.message
    );
    return {
      success: false,
      title: postData.title,
      error: error.message,
    };
  }
}

async function generateAllBlogPosts() {
  if (!config.apiKey) {
    console.error("❌ OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
    await dbConnect();

    const connected = await waitForConnection(15000); // Wait up to 15 seconds
    if (!connected) {
      throw new Error("Database connection timeout");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }

  const allPosts = [
    ...blogContentData.citySpecific.map((post) => ({
      ...post,
      type: "citySpecific",
    })),
    ...blogContentData.industryGuide.map((post) => ({
      ...post,
      type: "industryGuide",
    })),
    ...blogContentData.seasonal.map((post) => ({ ...post, type: "seasonal" })),
    ...blogContentData.caseStudies.map((post) => ({
      ...post,
      type: "caseStudy",
    })),
  ];

  const results = [];
  const errors = [];

  for (let i = 0; i < allPosts.length; i += config.batchSize) {
    const batch = allPosts.slice(i, i + config.batchSize);

    const batchPromises = batch.map((post) =>
      generateSingleBlogPost(post, post.type)
    );
    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach((result) => {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    });

    if (i + config.batchSize < allPosts.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, config.delayBetweenBatches)
      );
    }
  }
  if (results.length > 0) {
    results.forEach((result, index) => {});
  }

  if (errors.length > 0) {
    errors.forEach((error, index) => {});
  }

  const totalWords = results.reduce((sum, result) => sum + result.wordCount, 0);

  return {
    success: results.length,
    failed: errors.length,
    total: allPosts.length,
    results: results,
    errors: errors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllBlogPosts()
    .then((results) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

export default generateAllBlogPosts;
