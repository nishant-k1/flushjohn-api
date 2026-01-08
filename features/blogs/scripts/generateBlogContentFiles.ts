/**
 * Generate Blog Content Files
 * Creates JSON files with all blog post content for manual review and publishing
 */

import dotenv from "dotenv";
dotenv.config();

import blogGeneratorService from "../services/blogGeneratorService.js";
import blogContentData, {
  defaultCoverImages,
} from "../services/blogContentData.js";
import fs from "fs/promises";
import path from "path";

async function generateBlogContent(postData, templateType = "citySpecific") {
  try {
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
      publishedAt: new Date().toISOString(),
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
      wordCount: content.replace(/<[^>]*>/g, "").split(" ").length,
    };

    return blogPostData;
  } catch (error) {
    console.error(`❌ Error generating "${postData.title}":`, error.message);
    return null;
  }
}

async function generateAllBlogContent() {
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

  const outputDir = path.join(process.cwd(), "generated-blogs");
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch {
    // Directory may already exist, ignore error
  }

  const results = [];

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];

    const blogPost = await generateBlogContent(post, post.type);

    if (blogPost) {
      const filename = `blog-${i + 1}-${blogPost.slug}.json`;
      const filepath = path.join(outputDir, filename);

      await fs.writeFile(filepath, JSON.stringify(blogPost, null, 2));

      results.push({
        index: i + 1,
        title: blogPost.title,
        slug: blogPost.slug,
        wordCount: blogPost.wordCount,
        filename: filename,
      });

      if (i < allPosts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totalPosts: results.length,
    totalWords: results.reduce((sum, r) => sum + r.wordCount, 0),
    posts: results,
  };

  await fs.writeFile(
    path.join(outputDir, "generation-summary.json"),
    JSON.stringify(summary, null, 2)
  );

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllBlogContent()
    .then((_results) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Content generation failed:", error);
      process.exit(1);
    });
}

export default generateAllBlogContent;
