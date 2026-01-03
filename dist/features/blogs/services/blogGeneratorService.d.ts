/**
 * AI-Powered Blog Content Generator Service
 * Generates SEO-optimized blog posts for FlushJohn porta potty rentals
 */
export declare function generateBlogContent(templateType: any, params: any): Promise<any>;
export declare function generateMetaDescription(title: any, content: any, keywords: any): Promise<any>;
/**
 * Generate comprehensive blog metadata using AI
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @param {object} keywords - Keywords object
 * @param {string} category - Blog category
 * @returns {Promise<object>} - Complete blog metadata
 */
export declare function generateComprehensiveBlogMetadata(title: any, content: any, keywords: any, category: any): Promise<{
    tags: any;
    author: string;
    coverImageAlt: any;
    featured: boolean;
    priority: any;
}>;
/**
 * Generate AI-powered cover image description
 * @param {string} title - Blog title
 * @param {string} category - Blog category
 * @param {string} content - Blog content
 * @returns {Promise<string>} - Cover image description
 */
export declare function generateCoverImageDescription(title: any, category: any, content: any): Promise<any>;
export declare function generateSlug(title: any): any;
export declare function generateExcerpt(content: any, maxLength?: number): any;
/**
 * Generate AI-powered excerpt using OpenAI
 * @param {string} content - Blog content
 * @param {string} title - Blog title
 * @returns {Promise<string>} - Generated excerpt
 */
export declare function generateAIExcerpt(content: any, title: any, maxLength?: number): Promise<any>;
/**
 * Extract city and state from blog content/title using AI
 * Useful for event/construction posts that mention cities
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @returns {Promise<{city: string | null, state: string | null}>}
 */
export declare function extractCityAndState(title: any, content: any): Promise<{
    city: string;
    state: any;
}>;
export declare function extractTags(title: any, content: any, city?: any): any[];
export declare function generateCoverImageAlt(title: any, city?: any): string;
/**
 * Generate FAQ Schema for blog posts (helps win featured snippets)
 * @param {string} content - Blog content HTML
 * @param {string} title - Blog title
 * @returns {object|null} - FAQPage schema or null
 */
export declare function generateFAQSchema(content: any, title: any): {
    "@context": string;
    "@type": string;
    mainEntity: {
        "@type": string;
        name: any;
        acceptedAnswer: {
            "@type": string;
            text: string;
        };
    }[];
};
declare const _default: {
    generateBlogContent: typeof generateBlogContent;
    generateMetaDescription: typeof generateMetaDescription;
    generateSlug: typeof generateSlug;
    generateExcerpt: typeof generateExcerpt;
    extractTags: typeof extractTags;
    extractCityAndState: typeof extractCityAndState;
    generateCoverImageAlt: typeof generateCoverImageAlt;
    generateFAQSchema: typeof generateFAQSchema;
};
export default _default;
//# sourceMappingURL=blogGeneratorService.d.ts.map