/**
 * Automated Blog Generation Service
 * Handles weekly automated blog post generation and publishing
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", "..", ".env") });

import { dbConnect, waitForConnection } from "../../../lib/dbConnect/index.js";
import * as blogsService from "./blogsService.js";
import * as blogGeneratorService from "./blogGeneratorService.js";
import { getNextTopic, getCurrentSeason } from "./contentCalendar.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const defaultCoverImages = {
  events: [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Wedding
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Festival
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Party
  ],
  construction: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Construction
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Building
    "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Site
  ],
  tips: [
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Guide
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Tips
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80", // Planning
  ],
};

// Track used images to avoid duplicates
let usedImages = new Set();

/**
 * Generate a single automated blog post
 * @param {string} contentType - 'construction', 'city', 'problemSolving', or null for default
 * @param {boolean} randomize - Whether to randomize topic selection (for manual generation)
 */
export async function generateAutomatedBlogPost(
  contentType = null,
  randomize = false
) {
  try {
    const topic = getNextTopic(contentType, randomize);
    if (contentType) {
    }

    const generatedContent = await blogGeneratorService.generateBlogContent(
      topic.templateType || "citySpecific",
      topic.templateType === "citySpecific"
        ? [topic.title, topic.city, topic.state, topic.keywords]
        : topic.templateType === "industryGuide"
        ? [topic.title, topic.keywords, topic.focus]
        : [topic.title, topic.keywords, topic.season, topic.focus]
    );

    // Generate comprehensive AI metadata
    const [metaDescription, comprehensiveMetadata, coverImageDescription] =
      await Promise.all([
        blogGeneratorService.generateMetaDescription(
          topic.title,
          generatedContent,
          topic.keywords
        ),
        blogGeneratorService.generateComprehensiveBlogMetadata(
          topic.title,
          generatedContent,
          topic.keywords,
          topic.category
        ),
        blogGeneratorService.generateCoverImageDescription(
          topic.title,
          topic.category,
          generatedContent
        ),
      ]);

    const contentWithLinks = generatedContent;

    // Generate AI-powered excerpt
    const excerpt = await blogGeneratorService.generateAIExcerpt(
      contentWithLinks,
      topic.title,
      150
    );

    // Generate AI-powered cover image
    const coverImageSrc = await generateAICoverImage(
      topic.title,
      topic.category,
      contentWithLinks
    );

    const blogData = {
      title: topic.title,
      slug: blogsService.generateSlug(topic.title),
      content: contentWithLinks,
      excerpt: excerpt,
      author: "FlushJohn Team", // Always hardcoded
      tags: comprehensiveMetadata.tags,
      status: "published",
      category: topic.category,
      coverImage: {
        src: coverImageSrc,
        alt: comprehensiveMetadata.coverImageAlt,
      },
      publishedAt: new Date(),
      metaDescription: metaDescription.substring(0, 160),
      metaKeywords: topic.keywords.slice(0, 15),
      featured: comprehensiveMetadata.featured,
      priority: comprehensiveMetadata.priority,
      views: 0,
      likes: 0,
      comments: [],
      automated: true,
      automationDate: new Date(),
    };

    return blogData;
  } catch (error) {
    console.error("❌ Error generating automated blog post:", error);
    throw error;
  }
}

/**
 * Publish an automated blog post to the database
 */
export async function publishAutomatedBlogPost(blogData) {
  try {
    await dbConnect();
    const connected = await waitForConnection(10000);
    if (!connected) {
      throw new Error("Database connection timeout");
    }

    const createdBlog = await blogsService.createBlog(blogData);
    return createdBlog;
  } catch (error) {
    console.error("❌ Error publishing automated blog post:", error);
    throw error;
  }
}

/**
 * Complete automated blog generation and publishing workflow
 * @param {string} contentType - 'construction', 'city', 'problemSolving', or null for default
 * @param {boolean} randomize - Whether to randomize topic selection (for manual generation)
 */
export async function runAutomatedBlogGeneration(
  contentType = null,
  randomize = false
) {
  const startTime = new Date();

  try {
    const blogData = await generateAutomatedBlogPost(contentType, randomize);

    const publishedBlog = await publishAutomatedBlogPost(blogData);

    const endTime = new Date();
    const duration = endTime - startTime;
    return {
      success: true,
      blogPost: publishedBlog,
      duration,
      timestamp: endTime,
    };
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;

    console.error(`\n💥 Automated blog generation failed after ${duration}ms`);
    console.error("Error details:", error);

    return {
      success: false,
      error: error.message,
      duration,
      timestamp: endTime,
    };
  }
}

/**
 * Generate AI-powered cover image using Unsplash API
 */
async function generateAICoverImage(title, category, content) {
  try {
    // Generate search query using AI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at generating Unsplash search queries for blog cover images. Generate a single, specific search query that would find relevant, professional images for porta potty rental blog posts. The query should be 2-4 words maximum and focus on the main visual elements.",
        },
        {
          role: "user",
          content: `Generate an Unsplash search query for this blog post:

Title: "${title}"
Category: "${category}"
Content Theme: "${content.substring(0, 200)}..."

Requirements:
- 2-4 words maximum
- Focus on porta potty/portable toilet context
- Professional and relevant to the content
- Return ONLY the search query, no additional text`,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    const searchQuery = response.choices[0].message.content.trim();

    // Use Unsplash API to get a random image
    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
      searchQuery
    )}&orientation=landscape&w=1200&h=630&fit=crop`;

    const unsplashResponse = await fetch(unsplashUrl, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (unsplashResponse.ok) {
      const imageData = await unsplashResponse.json();
      return imageData.urls.custom || imageData.urls.regular;
    } else {
      console.warn("Unsplash API failed, falling back to default images");
      return getRandomCoverImage(category);
    }
  } catch (error) {
    console.error("Error generating AI cover image:", error);
    return getRandomCoverImage(category);
  }
}

/**
 * Get unique cover image for category (avoids duplicates) - fallback method
 */
function getRandomCoverImage(category) {
  const images = defaultCoverImages[category] || defaultCoverImages.tips;

  // Filter out already used images
  const availableImages = images.filter((img) => !usedImages.has(img));

  // If all images have been used, reset the used images set
  if (availableImages.length === 0) {
    usedImages.clear();
    availableImages.push(...images);
  }

  // Select a random image from available ones
  const randomIndex = Math.floor(Math.random() * availableImages.length);
  const selectedImage = availableImages[randomIndex];

  // Mark this image as used
  usedImages.add(selectedImage);

  return selectedImage;
}

/**
 * Get automation statistics
 */
export async function getAutomationStats() {
  try {
    await dbConnect();
    const connected = await waitForConnection(5000);
    if (!connected) {
      throw new Error("Database connection timeout");
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const automatedPosts = await blogsService.getAllBlogs({
      page: 1,
      limit: 100,
      sortBy: "publishedAt",
      sortOrder: "desc",
      status: "published",
    });

    const recentAutomatedPosts =
      automatedPosts.blogs?.filter(
        (post) =>
          post.automated && new Date(post.automationDate) >= thirtyDaysAgo
      ) || [];

    return {
      totalAutomatedPosts: recentAutomatedPosts.length,
      lastAutomatedPost: recentAutomatedPosts[0] || null,
      currentSeason: getCurrentSeason(),
      nextTopic: getNextTopic(),
      automationStatus: "active",
    };
  } catch (error) {
    console.error("Error getting automation stats:", error);
    return {
      totalAutomatedPosts: 0,
      lastAutomatedPost: null,
      currentSeason: getCurrentSeason(),
      nextTopic: getNextTopic(),
      automationStatus: "error",
      error: error.message,
    };
  }
}
