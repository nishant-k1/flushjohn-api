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

const defaultCoverImages = {
  events: [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=630&fit=crop&crop=center", // Wedding
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=630&fit=crop&crop=center", // Festival
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=630&fit=crop&crop=center", // Party
  ],
  construction: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=630&fit=crop&crop=center", // Construction
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=630&fit=crop&crop=center", // Building
    "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1200&h=630&fit=crop&crop=center", // Site
  ],
  tips: [
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=*,*&h=630&fit=crop&crop=center", // Guide
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop&crop=center", // Tips
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop&crop=center", // Planning
  ],
};

/**
 * Generate a single automated blog post
 * @param {string} contentType - 'construction', 'city', 'problemSolving', or null for default
 */
export async function generateAutomatedBlogPost(contentType = null) {
  try {
    const topic = getNextTopic(contentType);
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

    const metaDescription = await blogGeneratorService.generateMetaDescription(
      topic.title,
      generatedContent,
      topic.keywords
    );

    const contentWithLinks = generatedContent;

    // Generate AI-powered excerpt
    const excerpt = await blogGeneratorService.generateAIExcerpt(contentWithLinks, topic.title, 150);

    const blogData = {
      title: topic.title,
      slug: blogsService.generateSlug(topic.title),
      content: contentWithLinks,
      excerpt: excerpt,
      author: "FlushJohn Team",
      tags: topic.keywords,
      status: "published",
      category: topic.category,
      coverImage: {
        src: getRandomCoverImage(topic.category),
        alt: `Cover image for ${topic.title}`.substring(0, 100),
      },
      publishedAt: new Date(),
      metaDescription: metaDescription.substring(0, 160),
      metaKeywords: topic.keywords.slice(0, 15),
      featured: false,
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
 */
export async function runAutomatedBlogGeneration(contentType = null) {
  const startTime = new Date();

  try {
    const blogData = await generateAutomatedBlogPost(contentType);

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
 * Get random cover image for category
 */
function getRandomCoverImage(category) {
  const images = defaultCoverImages[category] || defaultCoverImages.tips;
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
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
