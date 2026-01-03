/**
 * Directly apply SEO fixes to all blog posts in database
 * No API needed - directly updates the database
 */
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import mongoose from "mongoose";
import { generateFAQSchema, generateMetaDescription, } from "../services/blogGeneratorService.js";
// Connect directly to database
const MONGO_URI = process.env.MONGO_DB_URI;
if (!MONGO_URI) {
    console.error("❌ MONGO_DB_URI not found in .env");
    process.exit(1);
}
console.log("🔧 Applying SEO Fixes Directly to Database...");
console.log("");
// Import Blog model
const BlogsSchema = new mongoose.Schema({}, { strict: false, collection: "blogs" });
const Blog = mongoose.model("Blog", BlogsSchema);
const stats = {
    total: 0,
    fixed: 0,
    faqAdded: 0,
    metaRegenerated: 0,
    keywordsAdded: 0,
    errors: 0,
};
function isGoodMetaDescription(metaDescription) {
    if (!metaDescription)
        return false;
    if (metaDescription.length < 120 || metaDescription.length > 160)
        return false;
    const hasKeywords = /porta potty|portable toilet|rental/i.test(metaDescription);
    const hasCallToAction = /call|quote|contact|get|find/i.test(metaDescription);
    return hasKeywords && hasCallToAction;
}
async function fixBlog(blog) {
    try {
        const updates = {};
        let hasUpdates = false;
        // Fix 1: Add FAQ Schema
        if (!blog.faqSchema && blog.content) {
            const faqSchema = generateFAQSchema(blog.content, blog.title);
            if (faqSchema && faqSchema.mainEntity && faqSchema.mainEntity.length > 0) {
                updates.faqSchema = faqSchema;
                hasUpdates = true;
                stats.faqAdded++;
                console.log(`  ✅ Adding FAQ schema (${faqSchema.mainEntity.length} questions)`);
            }
        }
        // Fix 2: Regenerate Meta Description
        if (blog.content) {
            const needsMetaFix = !blog.metaDescription || !isGoodMetaDescription(blog.metaDescription);
            if (needsMetaFix) {
                const keywords = {
                    primary: blog.metaKeywords?.[0] || blog.title,
                    secondary: blog.metaKeywords?.[1] || "",
                    longTail: blog.metaKeywords?.slice(2).join(" ") || "",
                };
                try {
                    const newMetaDescription = await generateMetaDescription(blog.title, blog.content, keywords);
                    if (newMetaDescription && newMetaDescription.length > 50) {
                        updates.metaDescription = newMetaDescription;
                        hasUpdates = true;
                        stats.metaRegenerated++;
                        console.log(`  ✅ Regenerating meta description (${newMetaDescription.length} chars)`);
                    }
                }
                catch (error) {
                    console.log(`  ⚠️  Meta generation failed: ${error.message}`);
                }
            }
        }
        // Fix 3: Add Question Keywords
        if (blog.content) {
            const existingKeywords = blog.metaKeywords || [];
            const questionKeywords = [
                "how many porta potties",
                "how much does porta potty rental cost",
                "where to rent porta potties",
                "what is the best porta potty rental",
                "porta potty rental prices",
                "how to rent porta potties",
            ];
            const missingQuestionKeywords = questionKeywords.filter(qk => !existingKeywords.some(ek => ek.toLowerCase().includes(qk.toLowerCase())));
            if (missingQuestionKeywords.length > 0 && existingKeywords.length < 15) {
                const newKeywords = [
                    ...existingKeywords,
                    ...missingQuestionKeywords.slice(0, 15 - existingKeywords.length)
                ];
                updates.metaKeywords = newKeywords;
                hasUpdates = true;
                stats.keywordsAdded++;
                console.log(`  ✅ Adding ${missingQuestionKeywords.length} question keywords`);
            }
        }
        // Apply updates directly to database
        if (hasUpdates) {
            await Blog.findByIdAndUpdate(blog._id, { $set: updates }, { new: true });
            stats.fixed++;
            console.log(`  ✅ Blog updated successfully`);
            return true;
        }
        return false;
    }
    catch (error) {
        stats.errors++;
        console.error(`  ❌ Error: ${error.message}`);
        return false;
    }
}
async function applyFixes() {
    try {
        console.log("🔌 Connecting to database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Database connected");
        console.log("");
        // Fetch all published blogs
        console.log("📚 Fetching published blogs...");
        const blogs = await Blog.find({ status: "published" }).lean();
        stats.total = blogs.length;
        if (blogs.length === 0) {
            console.log("⚠️  No published blogs found");
            await mongoose.disconnect();
            return;
        }
        console.log(`✅ Found ${blogs.length} published blog(s)`);
        console.log("");
        // Fix each blog
        console.log("🔧 Applying fixes...");
        console.log("");
        for (let i = 0; i < blogs.length; i++) {
            const blog = blogs[i];
            console.log(`[${i + 1}/${blogs.length}] "${blog.title}"`);
            await fixBlog(blog);
            console.log("");
        }
        // Summary
        console.log("=".repeat(80));
        console.log("📊 FIX SUMMARY");
        console.log("=".repeat(80));
        console.log(`Total blogs: ${stats.total}`);
        console.log(`Successfully fixed: ${stats.fixed}`);
        console.log(`Errors: ${stats.errors}`);
        console.log("");
        console.log("Fixes Applied:");
        console.log(`  FAQ schemas added: ${stats.faqAdded}`);
        console.log(`  Meta descriptions regenerated: ${stats.metaRegenerated}`);
        console.log(`  Question keywords added: ${stats.keywordsAdded}`);
        console.log("");
        console.log("✅ All fixes applied directly to database!");
        await mongoose.disconnect();
        console.log("✅ Database disconnected");
    }
    catch (error) {
        console.error("❌ Fatal error:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}
// Run it
applyFixes();
//# sourceMappingURL=applyFixesDirect.js.map