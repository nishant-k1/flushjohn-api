/**
 * Generate Blog Content Files
 * Creates JSON files with all blog post content for manual review and publishing
 */

import dotenv from 'dotenv';
dotenv.config();

import blogGeneratorService from '../services/blogGeneratorService.js';
import blogContentData, { defaultCoverImages } from '../services/blogContentData.js';
import fs from 'fs/promises';
import path from 'path';

// Generate a single blog post content
async function generateBlogContent(postData, templateType = 'citySpecific') {
  try {
    console.log(`🚀 Generating: "${postData.title}"`);
    
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
      publishedAt: new Date().toISOString(),
      metaDescription: metaDescription,
      metaKeywords: [
        postData.keywords.primary,
        postData.keywords.secondary,
        postData.keywords.longTail
      ],
      featured: false,
      views: 0,
      likes: 0,
      comments: [],
      wordCount: content.replace(/<[^>]*>/g, '').split(' ').length
    };

    console.log(`✅ Generated: ${blogPostData.wordCount} words`);
    return blogPostData;

  } catch (error) {
    console.error(`❌ Error generating "${postData.title}":`, error.message);
    return null;
  }
}

// Generate all blog posts and save to files
async function generateAllBlogContent() {
  console.log('🎯 Starting Blog Content Generation');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  
  const allPosts = [
    ...blogContentData.citySpecific.map(post => ({ ...post, type: 'citySpecific' })),
    ...blogContentData.industryGuide.map(post => ({ ...post, type: 'industryGuide' })),
    ...blogContentData.seasonal.map(post => ({ ...post, type: 'seasonal' }))
  ];

  console.log(`📝 Total posts to generate: ${allPosts.length}`);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'generated-blogs');
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  const results = [];
  
  // Generate posts one by one to avoid rate limits
  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    console.log(`\n📝 Processing ${i + 1}/${allPosts.length}: ${post.title}`);
    
    const blogPost = await generateBlogContent(post, post.type);
    
    if (blogPost) {
      // Save individual file
      const filename = `blog-${i + 1}-${blogPost.slug}.json`;
      const filepath = path.join(outputDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(blogPost, null, 2));
      console.log(`💾 Saved: ${filename}`);
      
      results.push({
        index: i + 1,
        title: blogPost.title,
        slug: blogPost.slug,
        wordCount: blogPost.wordCount,
        filename: filename
      });
      
      // Wait between requests to avoid rate limits
      if (i < allPosts.length - 1) {
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Save summary file
  const summary = {
    generatedAt: new Date().toISOString(),
    totalPosts: results.length,
    totalWords: results.reduce((sum, r) => sum + r.wordCount, 0),
    posts: results
  };

  await fs.writeFile(
    path.join(outputDir, 'generation-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  // Print final results
  console.log('\n🎉 Blog Content Generation Complete!');
  console.log(`✅ Successfully generated: ${results.length} posts`);
  console.log(`📊 Total words: ${summary.totalWords.toLocaleString()}`);
  console.log(`📁 Files saved to: ${outputDir}`);
  
  console.log('\n📋 Generated Posts:');
  results.forEach(result => {
    console.log(`${result.index}. ${result.title}`);
    console.log(`   🔗 Slug: ${result.slug}`);
    console.log(`   📊 Words: ${result.wordCount}`);
    console.log(`   📄 File: ${result.filename}`);
  });

  console.log('\n🚀 Next Steps:');
  console.log('1. Review the generated JSON files');
  console.log('2. Use the blog publishing script to upload to database');
  console.log('3. Verify posts appear on website');

  return results;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllBlogContent()
    .then(results => {
      console.log('\n✅ Content generation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Content generation failed:', error);
      process.exit(1);
    });
}

export default generateAllBlogContent;
