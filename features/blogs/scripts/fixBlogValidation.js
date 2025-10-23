/**
 * Fix Blog Validation Issues
 * Truncates alt text and meta description to meet validation requirements
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';

async function fixBlogValidation() {
  
  const generatedBlogsDir = path.join(process.cwd(), 'generated-blogs');
  
  try {
    const files = await fs.readdir(generatedBlogsDir);
    const blogFiles = files.filter(file => file.startsWith('blog-') && file.endsWith('.json'));
    
    
    let fixedCount = 0;
    
    for (const file of blogFiles) {
      const filePath = path.join(generatedBlogsDir, file);
      
      try {
        const blogData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        let needsFix = false;
        
        if (blogData.coverImage?.alt && blogData.coverImage.alt.length > 100) {
          blogData.coverImage.alt = blogData.coverImage.alt.substring(0, 97) + '...';
          needsFix = true;
        }
        
        if (blogData.metaDescription && blogData.metaDescription.length > 160) {
          blogData.metaDescription = blogData.metaDescription.substring(0, 157) + '...';
          needsFix = true;
        }
        
        if (needsFix) {
          await fs.writeFile(filePath, JSON.stringify(blogData, null, 2));
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    }
    
    
  } catch (error) {
    console.error('💥 Error during validation fix:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixBlogValidation()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Validation fixes failed:', error);
      process.exit(1);
    });
}

export default fixBlogValidation;
