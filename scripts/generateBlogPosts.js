/**
 * AI Blog Post Generator Script
 * Generates and publishes 20 SEO-optimized blog posts for FlushJohn
 */

import dotenv from 'dotenv';
dotenv.config();

import blogGeneratorService from '../services/blogGeneratorService.js';
import blogContentData, { defaultCoverImages } from '../services/blogContentData.js';
import * as blogsService from '../features/blogs/services/blogsService.js';
import { getCurrentDateTime } from '../lib/dayjs/index.js';

// Blog generation configuration
const config = {
  apiKey: process.env.OPENAI_API_KEY,
  batchSize: 5, // Generate 5 posts at a time to avoid rate limits
  delayBetweenBatches: 30000, // 30 seconds delay between batches
};

// Generate a single blog post
async function generateSingleBlogPost(postData, templateType = 'citySpecific') {
  try {
    console.log(`\n🚀 Generating blog post: "${postData.title}"`);
    
    // Generate content using AI
    const content = await blogGeneratorService.generateBlogContent(
      templateType,
      templateType === 'citySpecific' 
        ? [postData.title, postData.city, postData.state, postData.keywords]
        : templateType === 'industryGuide'
        ? [postData.title, postData.keywords, postData.focus]
        : [postData.title, postData.keywords, postData.season, postData.focus]
    );

    // Generate meta description
    const metaDescription = await blogGeneratorService.generateMetaDescription(
      postData.title,
      content,
      postData.keywords
    );

    // Generate slug
    const slug = blogGeneratorService.generateSlug(postData.title);

    // Generate excerpt
    const excerpt = blogGeneratorService.generateExcerpt(content);

    // Extract tags
    const tags = blogGeneratorService.extractTags(
      postData.title,
      content,
      postData.city || null
    );

    // Generate cover image alt text
    const coverImageAlt = blogGeneratorService.generateCoverImageAlt(
      postData.title,
      postData.city || null
    );

    // Get default cover image
    const coverImageUrl = defaultCoverImages[postData.category] || defaultCoverImages.tips;

    // Prepare blog post data
    const blogPostData = {
      title: postData.title,
      slug: slug,
      content: content,
      excerpt: excerpt,
      author: "FlushJohn Team",
      tags: tags,
      status: "published",
      category: postData.category,
      coverImage: {
        src: coverImageUrl,
        alt: coverImageAlt
      },
      publishedAt: getCurrentDateTime(),
      metaDescription: metaDescription,
      metaKeywords: [
        postData.keywords.primary,
        postData.keywords.secondary,
        postData.keywords.longTail
      ],
      featured: false,
      views: 0,
      likes: 0,
      comments: []
    };

    // Create blog post in database
    const createdBlog = await blogsService.createBlog(blogPostData);
    
    console.log(`✅ Successfully created blog post: ${createdBlog._id}`);
    console.log(`📝 Title: ${postData.title}`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📊 Word Count: ${content.replace(/<[^>]*>/g, '').split(' ').length}`);
    console.log(`🏷️ Tags: ${tags.join(', ')}`);
    
    return {
      success: true,
      blogId: createdBlog._id,
      title: postData.title,
      slug: slug,
      wordCount: content.replace(/<[^>]*>/g, '').split(' ').length
    };

  } catch (error) {
    console.error(`❌ Error generating blog post "${postData.title}":`, error.message);
    return {
      success: false,
      title: postData.title,
      error: error.message
    };
  }
}

// Generate all blog posts
async function generateAllBlogPosts() {
  console.log('🎯 Starting AI Blog Post Generation for FlushJohn');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🔑 Using OpenAI API Key: ${config.apiKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!config.apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  const allPosts = [
    ...blogContentData.citySpecific.map(post => ({ ...post, type: 'citySpecific' })),
    ...blogContentData.industryGuide.map(post => ({ ...post, type: 'industryGuide' })),
    ...blogContentData.seasonal.map(post => ({ ...post, type: 'seasonal' }))
  ];

  console.log(`📝 Total posts to generate: ${allPosts.length}`);
  console.log(`📊 Distribution: ${blogContentData.citySpecific.length} city-specific, ${blogContentData.industryGuide.length} industry guides, ${blogContentData.seasonal.length} seasonal`);

  const results = [];
  const errors = [];

  // Process posts in batches
  for (let i = 0; i < allPosts.length; i += config.batchSize) {
    const batch = allPosts.slice(i, i + config.batchSize);
    const batchNumber = Math.floor(i / config.batchSize) + 1;
    
    console.log(`\n🔄 Processing Batch ${batchNumber} (Posts ${i + 1}-${Math.min(i + config.batchSize, allPosts.length)})`);
    
    // Generate posts in current batch
    const batchPromises = batch.map(post => generateSingleBlogPost(post, post.type));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach(result => {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    });

    // Delay between batches (except for the last batch)
    if (i + config.batchSize < allPosts.length) {
      console.log(`⏳ Waiting ${config.delayBetweenBatches / 1000} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
    }
  }

  // Print final results
  console.log('\n🎉 Blog Post Generation Complete!');
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  console.log(`✅ Successfully generated: ${results.length} posts`);
  console.log(`❌ Failed: ${errors.length} posts`);
  
  if (results.length > 0) {
    console.log('\n📋 Successfully Generated Posts:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   🔗 Slug: ${result.slug}`);
      console.log(`   📊 Word Count: ${result.wordCount}`);
      console.log(`   🆔 Blog ID: ${result.blogId}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n❌ Failed Posts:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.title}`);
      console.log(`   Error: ${error.error}`);
    });
  }

  // Calculate total word count
  const totalWords = results.reduce((sum, result) => sum + result.wordCount, 0);
  console.log(`\n📊 Total Content Generated: ${totalWords.toLocaleString()} words`);
  console.log(`📈 Average Post Length: ${Math.round(totalWords / results.length)} words`);

  // SEO Impact Estimate
  console.log('\n🎯 Expected SEO Impact:');
  console.log(`🔍 Target Keywords: ${allPosts.length * 3} (primary, secondary, long-tail per post)`);
  console.log(`🌍 City Coverage: ${blogContentData.citySpecific.length} major cities`);
  console.log(`📚 Industry Topics: ${blogContentData.industryGuide.length} comprehensive guides`);
  console.log(`📅 Seasonal Content: ${blogContentData.seasonal.length} timely posts`);
  console.log(`🔗 Internal Links: ~${results.length * 4} links to city pages, products, quote page`);
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Verify all posts appear on /blog page');
  console.log('2. Test individual post pages');
  console.log('3. Check internal links are working');
  console.log('4. Submit sitemap to Google Search Console');
  console.log('5. Monitor organic traffic growth in 4-6 weeks');

  return {
    success: results.length,
    failed: errors.length,
    total: allPosts.length,
    results: results,
    errors: errors
  };
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllBlogPosts()
    .then(results => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export default generateAllBlogPosts;
