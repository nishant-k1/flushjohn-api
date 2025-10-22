/**
 * Fix Blog Validation Issues
 * Truncates alt text and meta description to meet validation requirements
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';

async function fixBlogValidation() {
  console.log('🔧 Fixing blog validation issues...');
  
  const generatedBlogsDir = path.join(process.cwd(), 'generated-blogs');
  
  try {
    const files = await fs.readdir(generatedBlogsDir);
    const blogFiles = files.filter(file => file.startsWith('blog-') && file.endsWith('.json'));
    
    console.log(`📝 Found ${blogFiles.length} blog files to check`);
    
    let fixedCount = 0;
    
    for (const file of blogFiles) {
      const filePath = path.join(generatedBlogsDir, file);
      
      try {
        const blogData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        let needsFix = false;
        
        // Fix alt text (max 100 characters)
        if (blogData.coverImage?.alt && blogData.coverImage.alt.length > 100) {
          blogData.coverImage.alt = blogData.coverImage.alt.substring(0, 97) + '...';
          needsFix = true;
          console.log(`✂️ Fixed alt text for: ${blogData.title}`);
        }
        
        // Fix meta description (max 160 characters)
        if (blogData.metaDescription && blogData.metaDescription.length > 160) {
          blogData.metaDescription = blogData.metaDescription.substring(0, 157) + '...';
          needsFix = true;
          console.log(`✂️ Fixed meta description for: ${blogData.title}`);
        }
        
        // Save if changes were made
        if (needsFix) {
          await fs.writeFile(filePath, JSON.stringify(blogData, null, 2));
          fixedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} blog files`);
    console.log('🚀 Ready to republish!');
    
  } catch (error) {
    console.error('💥 Error during validation fix:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixBlogValidation()
    .then(() => {
      console.log('\n✅ Validation fixes completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Validation fixes failed:', error);
      process.exit(1);
    });
}

export default fixBlogValidation;
