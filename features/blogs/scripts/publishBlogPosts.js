/**
 * Publish Generated Blog Posts to Database
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';
import * as blogsService from '../services/blogsService.js';
import { dbConnect, waitForConnection, getConnectionStatus } from '../../../lib/dbConnect/index.js';

async function publishBlogPosts() {
  console.log('🚀 Starting Blog Post Publishing...');
  
  // Connect to database first
  console.log('🔌 Connecting to database...');
  await dbConnect();
  
  // Wait for connection to be ready
  const connected = await waitForConnection(15000); // Wait up to 15 seconds
  if (!connected) {
    throw new Error('Database connection timeout');
  }
  
  console.log('✅ Database connected successfully');
  console.log('📊 Connection status:', getConnectionStatus());
  
  const generatedBlogsDir = path.join(process.cwd(), 'generated-blogs');
  
  try {
    // Read all JSON files
    const files = await fs.readdir(generatedBlogsDir);
    const blogFiles = files.filter(file => file.startsWith('blog-') && file.endsWith('.json'));
    
    console.log(`📝 Found ${blogFiles.length} blog posts to publish`);
    
    const results = [];
    
    for (let i = 0; i < blogFiles.length; i++) {
      const file = blogFiles[i];
      const filePath = path.join(generatedBlogsDir, file);
      
      try {
        console.log(`\n📄 Publishing ${i + 1}/${blogFiles.length}: ${file}`);
        
        // Read blog post data
        const blogData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Create blog post in database
        const createdBlog = await blogsService.createBlog(blogData);
        
        console.log(`✅ Published: ${blogData.title}`);
        console.log(`🆔 Blog ID: ${createdBlog._id}`);
        console.log(`🔗 Slug: ${blogData.slug}`);
        
        results.push({
          success: true,
          title: blogData.title,
          slug: blogData.slug,
          blogId: createdBlog._id,
          filename: file
        });
        
      } catch (error) {
        console.error(`❌ Failed to publish ${file}:`, error.message);
        results.push({
          success: false,
          filename: file,
          error: error.message
        });
      }
      
      // Small delay between posts
      if (i < blogFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Print summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n🎉 Blog Publishing Complete!');
    console.log(`✅ Successfully published: ${successful.length} posts`);
    console.log(`❌ Failed: ${failed.length} posts`);
    
    if (successful.length > 0) {
      console.log('\n📋 Published Posts:');
      successful.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   🔗 Slug: ${result.slug}`);
        console.log(`   🆔 ID: ${result.blogId}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed Posts:');
      failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.filename}`);
        console.log(`   Error: ${result.error}`);
      });
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Check your website /blog page');
    console.log('2. Verify individual post pages work');
    console.log('3. Test internal links');
    console.log('4. Submit sitemap to Google Search Console');
    
    return results;
    
  } catch (error) {
    console.error('💥 Error during publishing:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  publishBlogPosts()
    .then(results => {
      console.log('\n✅ Publishing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Publishing failed:', error);
      process.exit(1);
    });
}

export default publishBlogPosts;
