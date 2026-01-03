/**
 * AI-Powered Blog Content Generator Service
 * Generates SEO-optimized blog posts for FlushJohn porta potty rentals
 */
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
const websiteURL = "https://www.flushjohn.com";
const phone = { phone_number: "(877) 790-7062" };
// Lazy initialization of OpenAI client
let openai = null;
const getOpenAIClient = () => {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY environment variable is required for blog generation");
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
};
const citySpecificSystemPrompt = `You are a professional SEO content writer specializing in porta potty rental blog posts that rank in Google search results.

CRITICAL SEO RANKING REQUIREMENTS:

1. **Target Search Intent & Answer Real Questions:**
   - Users search for ANSWERS, not just keywords
   - Include question-based content: "How many...?", "What is...?", "Where to...?", "How much...?"
   - Answer questions DIRECTLY in first paragraph (40-60 words for featured snippets)
   - Use questions as H2 headings to target question-based searches
   - Match informational search intent (users looking for information/guides)

2. **Featured Snippet Optimization:**
   - Structure key answers to win featured snippets:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1
   - Use H2 headings that match common questions

3. **Question-Based Keyword Targeting:**
   - Target question keywords: "how many porta potties do I need", "how much does it cost", "where to rent"
   - Include these in FAQ section (5-7 questions minimum)
   - Answer each question comprehensively (100-150 words)
   - Use question format in H2 headings

4. **Natural Keyword Integration:**
   - Use primary keyword in: H1 title, first paragraph, at least 2 H2 headings
   - Use secondary keywords in: H2 headings, body paragraphs
   - Use long-tail keywords naturally throughout
   - Include synonyms and related terms (don't repeat exact phrase)
   - Vary keyword usage naturally

5. **Content Depth & Value:**
   - Provide MORE value than competitors
   - Include specific data, statistics, examples, case studies
   - Make it comprehensive (1800-2000 words)
   - Answer ALL related questions users might have
   - Include practical, actionable advice

Your writing style should be:
- Professional yet approachable
- Informative and helpful
- SEO-optimized with natural keyword integration
- Focused on solving customer problems
- Include practical tips and actionable advice

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Return ONLY clean HTML content directly
- DO NOT wrap the content in markdown code blocks (no backticks \`\`\`)
- DO NOT use \`\`\`html or \`\`\` at the beginning or end
- DO NOT include any code block markers or formatting artifacts
- Output should be raw HTML that can be directly inserted into a web page
- Start directly with HTML tags like <h1>, <p>, etc.
- Ensure all HTML is properly formatted and valid
- Use semantic HTML elements for better SEO

Always include:
- Internal links to relevant pages (use format: <a href="/porta-potty-rental/[city]">link text</a>)
- FAQ section with 5-7 questions (target question-based searches)
- Strong call-to-action at the end
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;
const industryGuideSystemPrompt = `You are a professional SEO content writer specializing in industry guides for porta potty rentals that rank in Google search results.

CRITICAL SEO RANKING REQUIREMENTS:

1. **Target Search Intent & Answer Real Questions:**
   - Users search for ANSWERS to specific questions
   - Include question-based content: "How to...?", "What is...?", "How many...?", "How much...?"
   - Answer questions DIRECTLY in first paragraph (40-60 words for featured snippets)
   - Use questions as H2 headings to target question-based searches
   - Match informational search intent (users looking for guides/how-to information)

2. **Featured Snippet Optimization:**
   - Structure key answers to win featured snippets:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1
   - Use H2 headings that match common questions

3. **Question-Based Keyword Targeting:**
   - Target question keywords: "how to", "what is", "how many", "how much"
   - Include these in FAQ section (5-7 questions minimum)
   - Answer each question comprehensively (100-150 words)
   - Use question format in H2 headings

4. **Natural Keyword Integration:**
   - Use primary keyword in: H1 title, first paragraph, at least 2 H2 headings
   - Use secondary keywords in: H2 headings, body paragraphs
   - Use long-tail keywords naturally throughout
   - Include synonyms and related terms
   - Vary keyword usage naturally

5. **Content Depth & Authority:**
   - Provide MORE value than competitors
   - Include specific data, regulations, statistics, best practices
   - Make it comprehensive (1800-2000 words)
   - Answer ALL related questions users might have
   - Establish expertise and authority

Your writing style should be:
- Expert and authoritative
- Highly informative with actionable advice
- SEO-optimized with natural keyword integration
- Include specific data, regulations, and best practices
- Focus on solving complex industry problems

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Return ONLY clean HTML content directly
- DO NOT wrap the content in markdown code blocks (no backticks \`\`\`)
- DO NOT use \`\`\`html or \`\`\` at the beginning or end
- DO NOT include any code block markers or formatting artifacts
- Output should be raw HTML that can be directly inserted into a web page
- Start directly with HTML tags like <h1>, <p>, etc.
- Ensure all HTML is properly formatted and valid
- Use semantic HTML elements for better SEO

Always include:
- Internal links to relevant pages
- FAQ section with 5-7 questions (target question-based searches)
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;
const seasonalSystemPrompt = `You are a professional SEO content writer specializing in seasonal porta potty rental blog posts that rank in Google search results.

CRITICAL SEO RANKING REQUIREMENTS:

1. **Target Search Intent & Answer Real Questions:**
   - Users search for seasonal planning information
   - Include question-based content: "How to plan for...?", "What to consider for...?", "When to rent...?"
   - Answer questions DIRECTLY in first paragraph (40-60 words for featured snippets)
   - Use questions as H2 headings to target question-based searches
   - Match informational search intent (users planning for season)

2. **Featured Snippet Optimization:**
   - Structure key answers to win featured snippets:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1
   - Use H2 headings that match common questions

3. **Question-Based Keyword Targeting:**
   - Target question keywords: "how to plan", "when to rent", "what to consider"
   - Include these in FAQ section (5-7 questions minimum)
   - Answer each question comprehensively (100-150 words)
   - Use question format in H2 headings

4. **Natural Keyword Integration:**
   - Use primary keyword in: H1 title, first paragraph, at least 2 H2 headings
   - Use secondary keywords in: H2 headings, body paragraphs
   - Use long-tail keywords naturally throughout
   - Include synonyms and related terms
   - Vary keyword usage naturally

5. **Content Depth & Timeliness:**
   - Provide timely, relevant seasonal information
   - Include seasonal statistics, trends, and best practices
   - Make it comprehensive (1800-2000 words)
   - Answer ALL related seasonal questions users might have
   - Focus on seasonal challenges and solutions

Your writing style should be:
- Timely and relevant to the season
- Practical with seasonal tips
- SEO-optimized with natural keyword integration
- Include seasonal statistics and trends
- Focus on seasonal challenges and solutions

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Return ONLY clean HTML content directly
- DO NOT wrap the content in markdown code blocks (no backticks \`\`\`)
- DO NOT use \`\`\`html or \`\`\` at the beginning or end
- DO NOT include any code block markers or formatting artifacts
- Output should be raw HTML that can be directly inserted into a web page
- Start directly with HTML tags like <h1>, <p>, etc.
- Ensure all HTML is properly formatted and valid
- Use semantic HTML elements for better SEO

Always include:
- Internal links to relevant pages
- FAQ section with 5-7 questions (target question-based searches)
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;
const caseStudySystemPrompt = `You are a professional SEO content writer specializing in compelling case study blog posts for porta potty rentals that rank in Google search results.

CRITICAL SEO RANKING REQUIREMENTS:

1. **Target Search Intent & Answer Real Questions:**
   - Users search for success stories and examples
   - Include question-based content: "How did...?", "What was the solution...?", "How many...?"
   - Answer questions DIRECTLY in first paragraph (40-60 words for featured snippets)
   - Use questions as H2 headings to target question-based searches
   - Match informational search intent (users looking for examples/success stories)

2. **Featured Snippet Optimization:**
   - Structure key answers to win featured snippets:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1
   - Use H2 headings that match common questions

3. **Question-Based Keyword Targeting:**
   - Target question keywords: "how did", "what was", "how many", "success story"
   - Include these in FAQ section (5-7 questions minimum)
   - Answer each question comprehensively (100-150 words)
   - Use question format in H2 headings

4. **Natural Keyword Integration:**
   - Use primary keyword in: H1 title, first paragraph, at least 2 H2 headings
   - Use secondary keywords in: H2 headings, body paragraphs
   - Use long-tail keywords naturally throughout
   - Include synonyms and related terms
   - Vary keyword usage naturally

5. **Content Depth & Credibility:**
   - Provide compelling narrative with specific results
   - Include quantifiable outcomes and metrics
   - Make it authentic and credible
   - Answer ALL related questions users might have
   - Show FlushJohn as the solution provider

Your writing style should be:
- Story-driven and narrative-focused
- Authentic and credible (based on typical industry scenarios)
- Results-oriented with specific metrics and outcomes
- SEO-optimized with natural keyword integration
- Highlight problem-solving and value delivered
- Show FlushJohn as the solution provider

CRITICAL OUTPUT FORMAT REQUIREMENTS:
- Return ONLY clean HTML content directly
- DO NOT wrap the content in markdown code blocks (no backticks \`\`\`)
- DO NOT use \`\`\`html or \`\`\` at the beginning or end
- DO NOT include any code block markers or formatting artifacts
- Output should be raw HTML that can be directly inserted into a web page
- Start directly with HTML tags like <h1>, <p>, etc.
- Ensure all HTML is properly formatted and valid
- Use semantic HTML elements for better SEO

Always include:
- Challenge/Problem section (what the client faced)
- Solution section (how FlushJohn helped)
- Results section (specific outcomes and metrics)
- Client testimonial or satisfaction indicator
- Internal links to relevant pages
- FAQ section with 5-7 questions (target question-based searches)
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;
const contentTemplates = {
    citySpecific: {
        systemPrompt: citySpecificSystemPrompt,
        userPrompt: (title, city, state, keywords) => {
            // Generate question-based keywords if not provided
            const questionKeywords = keywords.questions || [
                `how many porta potties do I need in ${city}`,
                `how much does porta potty rental cost in ${city}`,
                `where to rent porta potties in ${city}`,
                `what is the best porta potty rental company in ${city}`,
                `porta potty rental prices in ${city}`,
                `how to rent porta potties in ${city}`,
                `porta potty rental near me ${city}`,
            ];
            return `
Write a comprehensive blog post optimized for Google search rankings that will drive organic traffic:

Title: "${title}"
Target City: ${city}, ${state}
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}

CRITICAL SEO REQUIREMENTS:

1. **Answer Real User Questions (MOST IMPORTANT):**
   Target these question keywords in your content:
${questionKeywords.map((q) => `   - "${q}"`).join("\n")}
   
   - Answer each question DIRECTLY in the content
   - Use questions as H2 headings (e.g., <h2>How Many Porta Potties Do I Need in ${city}?</h2>)
   - Answer in first paragraph after H1 (40-60 words for featured snippets)
   - Include in FAQ section with detailed answers (100-150 words each)

2. **Search Intent Matching:**
   - Users searching "${keywords.primary}" want: INFORMATION about porta potty rentals
   - Provide comprehensive guides, tips, best practices
   - Include pricing information (transactional intent)
   - Make it actionable and helpful

3. **Featured Snippet Optimization:**
   - Structure key information as:
     * Numbered lists (for "how to" queries)
     * Tables (for cost comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1
   - Use H2 headings that match common questions

4. **Content Structure:**
   - Word count: 1800-2000 words
   - Introduction: Answer main question in first 100 words (include primary keyword)
   - 4-6 H2 sections (each targeting a question keyword)
   - FAQ section: 5-7 questions (use the question keywords above)
   - Conclusion with CTA

5. **Keyword Placement:**
   - Primary keyword: H1 title, first paragraph, at least 2 H2 headings
   - Secondary keywords: H2 headings, body paragraphs
   - Long-tail keywords: naturally throughout
   - Question keywords: FAQ section, H2 headings
   - Use synonyms and related terms (don't repeat exact phrase)

6. **Internal Linking:**
   - City page: /porta-potty-rental/${city.toLowerCase().replace(/\s+/g, "-")}
   - Product pages: /rental-products/standard-porta-potty, /rental-products/luxury-restroom-trailer
   - Quote page: /quote
   - FAQ page: /faq
   - Link to 3-5 related service pages naturally

7. **Local SEO:**
   - Include ${city}, ${state} naturally throughout (10-15 times)
   - Mention local landmarks, events, or characteristics
   - Include local pricing if possible
   - Reference local regulations or requirements

8. **Content Quality:**
   - Provide unique, valuable information
   - Include specific data, statistics, or examples
   - Make it better than competitor content
   - Answer user questions comprehensively

OUTPUT FORMAT: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper.
Start directly with HTML tags (e.g., <h1>, <p>, <div>).

Write content that will RANK IN GOOGLE by answering real user questions about porta potty rentals in ${city}. Make it the best resource available on this topic.`;
        },
    },
    industryGuide: {
        systemPrompt: industryGuideSystemPrompt,
        userPrompt: (title, keywords, focus) => {
            // Generate question-based keywords
            const questionKeywords = [
                `how to ${keywords.primary.toLowerCase()}`,
                `what is ${keywords.primary.toLowerCase()}`,
                `how much does ${keywords.primary.toLowerCase()} cost`,
                `how many ${keywords.primary.toLowerCase()}`,
                `${keywords.primary.toLowerCase()} guide`,
                `${keywords.primary.toLowerCase()} best practices`,
                `${keywords.primary.toLowerCase()} requirements`,
            ];
            return `
Write a comprehensive industry guide optimized for Google search rankings:

Title: "${title}"
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}
Focus Area: ${focus}

CRITICAL SEO REQUIREMENTS:

1. **Answer Real User Questions (MOST IMPORTANT):**
   Target these question keywords:
${questionKeywords.map((q) => `   - "${q}"`).join("\n")}
   
   - Answer each question DIRECTLY in the content
   - Use questions as H2 headings
   - Answer in first paragraph after H1 (40-60 words for featured snippets)
   - Include in FAQ section with detailed answers

2. **Search Intent Matching:**
   - Users searching "${keywords.primary}" want: INFORMATION/guide about this topic
   - Provide comprehensive how-to guides, best practices, requirements
   - Include specific data, regulations, statistics
   - Make it actionable and authoritative

3. **Featured Snippet Optimization:**
   - Structure key information as:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1

4. **Content Structure:**
   - Word count: 1800-2000 words
   - Introduction: Answer main question in first 100 words
   - 4-6 H2 sections (each targeting a question keyword)
   - FAQ section: 5-7 questions (use question keywords)
   - Conclusion with CTA

5. **Keyword Placement:**
   - Primary keyword: H1 title, first paragraph, at least 2 H2 headings
   - Secondary keywords: H2 headings, body paragraphs
   - Long-tail keywords: naturally throughout
   - Question keywords: FAQ section, H2 headings

6. **Internal Linking:**
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
   - Link to 3-5 related pages naturally

7. **Content Quality:**
   - Include specific industry data, regulations, or best practices
   - Add practical examples and case studies
   - Provide actionable advice
   - Make it the best resource available

OUTPUT FORMAT: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper.
Start directly with HTML tags (e.g., <h1>, <p>, <div>).

Write authoritative content that will RANK IN GOOGLE and establishes FlushJohn as the industry expert.`;
        },
    },
    seasonal: {
        systemPrompt: seasonalSystemPrompt,
        userPrompt: (title, keywords, season, focus) => {
            const questionKeywords = [
                `how to plan porta potty rental for ${season}`,
                `when to rent porta potties for ${season} events`,
                `what to consider for ${season} porta potty rental`,
                `how many porta potties do I need for ${season} events`,
                `${season} porta potty rental tips`,
                `${season} event porta potty planning`,
                `best time to rent porta potties for ${season}`,
            ];
            return `
Write a comprehensive seasonal blog post optimized for Google search rankings:

Title: "${title}"
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}
Season: ${season}
Focus: ${focus}

CRITICAL SEO REQUIREMENTS:

1. **Answer Real User Questions (MOST IMPORTANT):**
   Target these question keywords:
${questionKeywords.map((q) => `   - "${q}"`).join("\n")}
   
   - Answer each question DIRECTLY in the content
   - Use questions as H2 headings
   - Answer in first paragraph after H1 (40-60 words for featured snippets)
   - Include in FAQ section with detailed answers

2. **Search Intent Matching:**
   - Users searching "${keywords.primary}" want: SEASONAL PLANNING information
   - Provide comprehensive seasonal guides, tips, timing considerations
   - Include seasonal statistics, trends, best practices
   - Make it timely and actionable

3. **Featured Snippet Optimization:**
   - Structure key information as:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1

4. **Content Structure:**
   - Word count: 1800-2000 words
   - Introduction: Answer main question in first 100 words
   - 4-6 H2 sections (each targeting a question keyword)
   - FAQ section: 5-7 questions (use question keywords)
   - Conclusion with CTA

5. **Keyword Placement:**
   - Primary keyword: H1 title, first paragraph, at least 2 H2 headings
   - Secondary keywords: H2 headings, body paragraphs
   - Long-tail keywords: naturally throughout
   - Question keywords: FAQ section, H2 headings

6. **Internal Linking:**
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
   - Link to 3-5 related pages naturally

7. **Seasonal Content:**
   - Include seasonal statistics, trends, and timing considerations
   - Add seasonal-specific tips and recommendations
   - Address seasonal challenges and solutions
   - Make it timely and valuable for ${season} planning

OUTPUT FORMAT: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper.
Start directly with HTML tags (e.g., <h1>, <p>, <div>).

Write engaging content that will RANK IN GOOGLE and helps customers plan for the ${season} season.`;
        },
    },
    caseStudy: {
        systemPrompt: caseStudySystemPrompt,
        userPrompt: (title, keywords, focus) => {
            const questionKeywords = [
                `how did FlushJohn solve ${keywords.primary.toLowerCase()}`,
                `what was the solution for ${keywords.primary.toLowerCase()}`,
                `how many porta potties were needed for ${keywords.primary.toLowerCase()}`,
                `${keywords.primary.toLowerCase()} success story`,
                `${keywords.primary.toLowerCase()} case study results`,
                `how to achieve ${keywords.primary.toLowerCase()} success`,
                `${keywords.primary.toLowerCase()} best practices`,
            ];
            return `
Write a compelling case study blog post optimized for Google search rankings:

Title: "${title}"
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}
Focus Area: ${focus}

CRITICAL SEO REQUIREMENTS:

1. **Answer Real User Questions (MOST IMPORTANT):**
   Target these question keywords:
${questionKeywords.map((q) => `   - "${q}"`).join("\n")}
   
   - Answer each question DIRECTLY in the content
   - Use questions as H2 headings
   - Answer in first paragraph after H1 (40-60 words for featured snippets)
   - Include in FAQ section with detailed answers

2. **Search Intent Matching:**
   - Users searching "${keywords.primary}" want: SUCCESS STORIES/examples
   - Provide compelling narrative with specific results
   - Include quantifiable outcomes and metrics
   - Show how FlushJohn solved similar challenges

3. **Featured Snippet Optimization:**
   - Structure key information as:
     * Numbered lists (for "how to" queries)
     * Tables (for comparisons)
     * Short paragraphs (40-60 words for direct answers)
   - Place best answer in first paragraph after H1

4. **Content Structure:**
   - Word count: 1800-2000 words
   - Introduction: Answer main question in first 100 words
   - Challenge/Problem section
   - Solution section (how FlushJohn helped)
   - Results section (quantifiable outcomes)
   - Client Feedback section
   - FAQ section: 5-7 questions (use question keywords)
   - Conclusion with CTA

5. **Keyword Placement:**
   - Primary keyword: H1 title, first paragraph, at least 2 H2 headings
   - Secondary keywords: H2 headings, body paragraphs
   - Long-tail keywords: naturally throughout
   - Question keywords: FAQ section, H2 headings

6. **Case Study Details:**
   - Tell a compelling story with:
     * Specific scenario and context
     * Challenge or problem the client faced
     * How FlushJohn provided the solution
     * Quantifiable results (e.g., "10,000 attendees served", "same-day delivery", "100% satisfaction")
     * Client satisfaction or testimonial
   - Include specific details that make it realistic and credible

7. **Internal Linking:**
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
   - Link to 3-5 related pages naturally

OUTPUT FORMAT: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper.
Start directly with HTML tags (e.g., <h1>, <p>, <div>).

Write a compelling case study that will RANK IN GOOGLE and showcases FlushJohn's success in solving real challenges.`;
        },
    },
};
export async function generateBlogContent(templateType, params) {
    try {
        const template = contentTemplates[templateType];
        if (!template) {
            throw new Error(`Invalid template type: ${templateType}`);
        }
        const response = await getOpenAIClient().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: template.systemPrompt,
                },
                {
                    role: "user",
                    content: template.userPrompt(...params),
                },
            ],
            max_tokens: 4000,
            temperature: 0.8, // Increased temperature for more creativity and uniqueness
            seed: Math.floor(Math.random() * 1000000), // Add random seed for uniqueness
        });
        let content = response.choices[0].message.content;
        // Enhanced content cleaning for both CRM and public web compatibility
        content = content
            .replace(/^```html\s*\n?/gi, "") // Remove opening ```html with optional newline
            .replace(/\n?\s*```\s*$/gi, "") // Remove closing ``` with optional newline
            .replace(/^```html\s*/gi, "") // Fallback: Remove opening ```html
            .replace(/\s*```\s*$/gi, "") // Fallback: Remove closing ```
            .replace(/^```\s*\n?/gi, "") // Remove any opening ``` with optional newline
            .replace(/\n?\s*```\s*$/gi, "") // Remove any closing ``` with optional newline
            .replace(/^`\s*/gm, "") // Remove any leading backticks
            .replace(/\s*`$/gm, "") // Remove any trailing backticks
            .trim();
        // Ensure content starts with proper HTML
        if (!content.startsWith("<")) {
            content = "<p>" + content + "</p>";
        }
        return content;
    }
    catch (error) {
        throw error;
    }
}
export async function generateMetaDescription(title, content, keywords) {
    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an SEO expert. Generate compelling meta descriptions that are 150-160 characters, include primary keywords, and encourage clicks. Return ONLY the meta description text without any code blocks or formatting.",
                },
                {
                    role: "user",
                    content: `Generate a meta description for:
Title: ${title}
Primary Keywords: ${keywords.primary}
Content Summary: ${content.substring(0, 500)}...

Requirements:
- 150-160 characters
- Include primary keyword naturally
- Include call-to-action
- Mention location if city-specific
- Make it click-worthy
- Return ONLY the description text, no code blocks or quotes`,
                },
            ],
            max_tokens: 100,
            temperature: 0.7,
            seed: Math.floor(Math.random() * 1000000),
        });
        let description = response.choices[0].message.content.trim();
        description = description
            .replace(/^["']|["']$/g, "")
            .replace(/^```.*$/gm, "")
            .trim();
        if (description.length > 160) {
            description = description.substring(0, 157) + "...";
        }
        return description;
    }
    catch (error) {
        console.error("Error generating meta description:", error);
        return `Professional porta potty rental services. Get your free quote today! Call ${phone.phone_number}.`;
    }
}
/**
 * Generate comprehensive blog metadata using AI
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @param {object} keywords - Keywords object
 * @param {string} category - Blog category
 * @returns {Promise<object>} - Complete blog metadata
 */
export async function generateComprehensiveBlogMetadata(title, content, keywords, category) {
    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert content strategist and SEO specialist. Generate comprehensive blog metadata including tags and cover image descriptions. Return a JSON object with the following structure:
{
  "tags": ["tag1", "tag2", "tag3"],
  "coverImageAlt": "Descriptive alt text for cover image",
  "featured": true/false,
  "priority": "high/medium/low"
}

Requirements:
- Tags: 5-8 relevant, SEO-friendly tags
- Cover Image Alt: Descriptive, SEO-optimized alt text (max 100 chars)
- Featured: true for high-value content, false for regular posts
- Priority: "high" for trending topics, "medium" for standard content, "low" for niche topics
- Author is always "FlushJohn Team" (do not include in JSON)
- Return ONLY the JSON object, no additional text or formatting`,
                },
                {
                    role: "user",
                    content: `Generate comprehensive metadata for this blog:

Title: "${title}"
Category: "${category}"
Content Summary: "${content.substring(0, 1000)}..."
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}

Requirements:
- Generate 5-8 relevant tags based on content and keywords
- Create SEO-optimized cover image alt text
- Determine if content should be featured
- Assess content priority level
- Author is always "FlushJohn Team" (hardcoded)
- Return ONLY valid JSON object`,
                },
            ],
            max_tokens: 300,
            temperature: 0.6,
        });
        let metadata = response.choices[0].message.content.trim();
        // Clean up any formatting artifacts
        metadata = metadata
            .replace(/^```json\s*/, "")
            .replace(/\s*```$/, "")
            .replace(/^```\s*/, "")
            .trim();
        try {
            const parsedMetadata = JSON.parse(metadata);
            // Validate and clean the metadata
            return {
                tags: Array.isArray(parsedMetadata.tags)
                    ? parsedMetadata.tags.slice(0, 8)
                    : [],
                author: "FlushJohn Team", // Always hardcoded
                coverImageAlt: parsedMetadata.coverImageAlt ||
                    `Cover image for ${title}`.substring(0, 100),
                featured: Boolean(parsedMetadata.featured),
                priority: ["high", "medium", "low"].includes(parsedMetadata.priority)
                    ? parsedMetadata.priority
                    : "medium",
            };
        }
        catch (parseError) {
            console.error("Error parsing AI metadata:", parseError);
            // Fallback to basic metadata
            return {
                tags: [keywords.primary, "porta-potty-rental", "flushjohn"],
                author: "FlushJohn Team", // Always hardcoded
                coverImageAlt: `Cover image for ${title}`.substring(0, 100),
                featured: false,
                priority: "medium",
            };
        }
    }
    catch (error) {
        console.error("Error generating comprehensive metadata:", error);
        // Fallback to basic metadata
        return {
            tags: [keywords.primary, "porta-potty-rental", "flushjohn"],
            author: "FlushJohn Team", // Always hardcoded
            coverImageAlt: `Cover image for ${title}`.substring(0, 100),
            featured: false,
            priority: "medium",
        };
    }
}
/**
 * Generate AI-powered cover image description
 * @param {string} title - Blog title
 * @param {string} category - Blog category
 * @param {string} content - Blog content
 * @returns {Promise<string>} - Cover image description
 */
export async function generateCoverImageDescription(title, category, content) {
    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a professional image description expert. Generate detailed, SEO-optimized descriptions for blog cover images. Focus on visual elements that would appeal to the target audience and include relevant keywords naturally.",
                },
                {
                    role: "user",
                    content: `Generate a cover image description for:

Title: "${title}"
Category: "${category}"
Content Theme: "${content.substring(0, 500)}..."

Requirements:
- 80-120 characters
- Include visual elements relevant to ${category}
- Mention porta potty/portable toilet context
- SEO-friendly with natural keyword integration
- Professional and appealing tone
- Return ONLY the description text`,
                },
            ],
            max_tokens: 150,
            temperature: 0.7,
        });
        let description = response.choices[0].message.content.trim();
        // Clean up formatting
        description = description
            .replace(/^["']|["']$/g, "")
            .replace(/^```.*$/gm, "")
            .trim();
        // Ensure proper length
        if (description.length > 120) {
            description = description.substring(0, 117) + "...";
        }
        return description;
    }
    catch (error) {
        console.error("Error generating cover image description:", error);
        return `Professional ${category} porta potty rental services - ${title}`.substring(0, 100);
    }
}
export function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}
export function generateExcerpt(content, maxLength = 150) {
    const plainText = content.replace(/<[^>]*>/g, "");
    if (plainText.length <= maxLength) {
        return plainText;
    }
    const truncated = plainText.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf(".");
    if (lastSentence > maxLength * 0.7) {
        return plainText.substring(0, lastSentence + 1);
    }
    return truncated + "...";
}
/**
 * Generate AI-powered excerpt using OpenAI
 * @param {string} content - Blog content
 * @param {string} title - Blog title
 * @returns {Promise<string>} - Generated excerpt
 */
export async function generateAIExcerpt(content, title, maxLength = 150) {
    try {
        // Remove HTML tags and clean content for AI processing
        const cleanContent = content.replace(/<[^>]*>/g, "").trim();
        // Limit content to first 2000 characters to stay within token limits
        const truncatedContent = cleanContent.substring(0, 2000);
        const response = await getOpenAIClient().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert content writer. Generate a compelling, SEO-friendly excerpt (summary) for blog posts. The excerpt should be 120-150 characters, engaging, and capture the main value proposition. Return ONLY plain text without any HTML tags, quotes, backticks, or special formatting. Ensure the excerpt is optimized for both CRM display and public web SEO.",
                },
                {
                    role: "user",
                    content: `Generate a compelling excerpt for this blog post:

Title: "${title}"
Content: "${truncatedContent}"

Requirements:
- 120-150 characters
- Engaging and informative
- Include key benefits or value proposition
- SEO-friendly for public web display
- Clean text suitable for CRM edit interface
- NO HTML tags, quotes, backticks, or special formatting
- Return ONLY plain text excerpt
- Do not include any markup or formatting`,
                },
            ],
            max_tokens: 100,
            temperature: 0.7,
        });
        let excerpt = response.choices[0].message.content.trim();
        // Enhanced cleaning for both CRM and public web compatibility
        excerpt = excerpt
            .replace(/<[^>]*>/g, "") // Remove HTML tags first
            .replace(/^["']|["']$/g, "") // Remove surrounding quotes
            .replace(/^```.*$/gm, "") // Remove code block markers
            .replace(/^`\s*/gm, "") // Remove any leading backticks
            .replace(/\s*`$/gm, "") // Remove any trailing backticks
            .replace(/^```html\s*\n?/gi, "") // Remove HTML code blocks
            .replace(/\n?\s*```\s*$/gi, "") // Remove closing code blocks
            .replace(/\s+/g, " ") // Replace multiple spaces with single space
            .trim();
        // Ensure proper length
        if (excerpt.length > maxLength) {
            excerpt = excerpt.substring(0, maxLength - 3) + "...";
        }
        return excerpt;
    }
    catch (error) {
        console.error("Error generating AI excerpt:", error);
        // Fallback to basic text processing if AI fails
        return generateExcerpt(content, maxLength);
    }
}
/**
 * Extract city and state from blog content/title using AI
 * Useful for event/construction posts that mention cities
 * @param {string} title - Blog title
 * @param {string} content - Blog content
 * @returns {Promise<{city: string | null, state: string | null}>}
 */
export async function extractCityAndState(title, content) {
    try {
        // Clean content (remove HTML tags)
        const cleanContent = content.replace(/<[^>]*>/g, "").trim();
        const textSample = (title + " " + cleanContent.substring(0, 2000)).trim();
        // List of cities we serve
        const cities = [
            "Houston",
            "Dallas",
            "Austin",
            "San Antonio",
            "Fort Worth", // TX
            "Miami",
            "Orlando",
            "Tampa",
            "Jacksonville",
            "Fort Lauderdale", // FL
            "Los Angeles",
            "San Diego",
            "Sacramento",
            "San Jose",
            "Fresno", // CA
            "Atlanta",
            "Savannah",
            "Augusta",
            "Macon",
            "Columbus", // GA
            "Chicago",
            "Springfield",
            "Peoria",
            "Rockford",
            "Naperville", // IL
            "Dover", // DE
        ];
        const states = [
            "Texas",
            "TX",
            "Florida",
            "FL",
            "California",
            "CA",
            "Georgia",
            "GA",
            "Illinois",
            "IL",
            "Delaware",
            "DE",
        ];
        // Check if any city is mentioned
        const mentionedCity = cities.find((city) => {
            const cityLower = city.toLowerCase();
            const textLower = textSample.toLowerCase();
            // Check for city name (word boundary to avoid partial matches)
            return (textLower.includes(cityLower) ||
                new RegExp(`\\b${cityLower}\\b`, "i").test(textLower));
        });
        if (!mentionedCity) {
            return { city: null, state: null };
        }
        // Try to find state mentioned near the city
        const cityIndex = textSample
            .toLowerCase()
            .indexOf(mentionedCity.toLowerCase());
        const surroundingText = textSample
            .substring(Math.max(0, cityIndex - 100), Math.min(textSample.length, cityIndex + mentionedCity.length + 100))
            .toLowerCase();
        const mentionedState = states.find((state) => {
            const stateLower = state.toLowerCase();
            return (surroundingText.includes(`, ${stateLower}`) ||
                surroundingText.includes(`${stateLower}`) ||
                surroundingText.includes(` ${stateLower},`));
        });
        // Normalize state to full name or abbreviation
        let stateAbbr = null;
        if (mentionedState) {
            const stateMap = {
                texas: "TX",
                tx: "TX",
                florida: "FL",
                fl: "FL",
                california: "CA",
                ca: "CA",
                georgia: "GA",
                ga: "GA",
                illinois: "IL",
                il: "IL",
                delaware: "DE",
                de: "DE",
            };
            stateAbbr =
                stateMap[mentionedState.toLowerCase()] ||
                    mentionedState.toUpperCase().slice(0, 2);
        }
        else {
            // Try to infer state from city
            const cityStateMap = {
                Houston: "TX",
                Dallas: "TX",
                Austin: "TX",
                "San Antonio": "TX",
                "Fort Worth": "TX",
                Miami: "FL",
                Orlando: "FL",
                Tampa: "FL",
                Jacksonville: "FL",
                "Fort Lauderdale": "FL",
                "Los Angeles": "CA",
                "San Diego": "CA",
                Sacramento: "CA",
                "San Jose": "CA",
                Fresno: "CA",
                Atlanta: "GA",
                Savannah: "GA",
                Augusta: "GA",
                Macon: "GA",
                Columbus: "GA",
                Chicago: "IL",
                Springfield: "IL",
                Peoria: "IL",
                Rockford: "IL",
                Naperville: "IL",
                Dover: "DE",
            };
            stateAbbr = cityStateMap[mentionedCity] || null;
        }
        // Convert state abbreviation to full name for storage
        const stateFullNameMap = {
            TX: "Texas",
            FL: "Florida",
            CA: "California",
            GA: "Georgia",
            IL: "Illinois",
            DE: "Delaware",
        };
        const stateFullName = stateAbbr
            ? stateFullNameMap[stateAbbr] || stateAbbr
            : null;
        return {
            city: mentionedCity,
            state: stateFullName || stateAbbr,
        };
    }
    catch (error) {
        console.error("Error extracting city/state:", error);
        return { city: null, state: null };
    }
}
export function extractTags(title, content, city = null) {
    const baseTags = ["porta-potty-rental", "portable-toilets", "flushjohn"];
    if (city) {
        baseTags.push(city.toLowerCase().replace(/\s+/g, "-"));
    }
    const text = (title + " " + content).toLowerCase();
    const keywordTags = [];
    if (text.includes("wedding"))
        keywordTags.push("weddings");
    if (text.includes("construction"))
        keywordTags.push("construction");
    if (text.includes("event"))
        keywordTags.push("events");
    if (text.includes("festival"))
        keywordTags.push("festivals");
    if (text.includes("ada"))
        keywordTags.push("ada-compliant");
    if (text.includes("luxury") || text.includes("trailer"))
        keywordTags.push("luxury-restrooms");
    if (text.includes("cost") || text.includes("price"))
        keywordTags.push("pricing");
    if (text.includes("guide") || text.includes("tips"))
        keywordTags.push("guides");
    return [...baseTags, ...keywordTags].slice(0, 10); // Limit to 10 tags
}
export function generateCoverImageAlt(title, city = null) {
    const baseAlt = `FlushJohn porta potty rental services - ${title}`;
    const altText = city ? `${baseAlt} in ${city}` : baseAlt;
    if (altText.length > 100) {
        return altText.substring(0, 97) + "...";
    }
    return altText;
}
/**
 * Generate FAQ Schema for blog posts (helps win featured snippets)
 * @param {string} content - Blog content HTML
 * @param {string} title - Blog title
 * @returns {object|null} - FAQPage schema or null
 */
export function generateFAQSchema(content, title) {
    try {
        // Extract questions from FAQ section (look for H2 or H3 with question marks)
        const questionPattern = /<h[23][^>]*>(.*?\?)<\/h[23]>/gi;
        const questions = [];
        let match;
        while ((match = questionPattern.exec(content)) !== null) {
            const questionText = match[1].replace(/<[^>]*>/g, "").trim();
            if (questionText && questionText.length > 10) {
                questions.push({
                    question: questionText,
                    position: match.index,
                });
            }
        }
        // If no questions found in headings, try to extract from FAQ section
        if (questions.length === 0) {
            // Look for FAQ section and extract questions
            const faqSectionMatch = content.match(/<h2[^>]*>.*?FAQ.*?<\/h2>([\s\S]*?)(?=<h2|$)/i);
            if (faqSectionMatch) {
                const faqContent = faqSectionMatch[1];
                const questionMatches = faqContent.match(/<[ph][^>]*>(.*?\?)<\/[ph]>/gi);
                if (questionMatches) {
                    questionMatches.forEach((q) => {
                        const qText = q.replace(/<[^>]*>/g, "").trim();
                        if (qText && qText.length > 10) {
                            questions.push({ question: qText, position: 0 });
                        }
                    });
                }
            }
        }
        if (questions.length === 0) {
            return null;
        }
        // Extract answers (next paragraph after each question)
        const faqItems = questions
            .slice(0, 10)
            .map((q, index) => {
            // Try to find answer after question
            const questionEscaped = q.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const answerPattern = new RegExp(`${questionEscaped}[\\s\\S]*?<p[^>]*>(.*?)<\\/p>`, "i");
            const answerMatch = content.match(answerPattern);
            let answerText = "";
            if (answerMatch && answerMatch[1]) {
                answerText = answerMatch[1]
                    .replace(/<[^>]*>/g, "")
                    .trim()
                    .substring(0, 500); // Limit answer length
            }
            // If no answer found, create a generic one
            if (!answerText || answerText.length < 20) {
                answerText = `Find the answer to "${q.question}" in our comprehensive guide about ${title}.`;
            }
            return {
                "@type": "Question",
                name: q.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: answerText,
                },
            };
        })
            .filter((item) => item.acceptedAnswer.text.length > 20);
        if (faqItems.length === 0) {
            return null;
        }
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems,
        };
    }
    catch (error) {
        console.error("Error generating FAQ schema:", error);
        return null;
    }
}
export default {
    generateBlogContent,
    generateMetaDescription,
    generateSlug,
    generateExcerpt,
    extractTags,
    extractCityAndState,
    generateCoverImageAlt,
    generateFAQSchema,
};
//# sourceMappingURL=blogGeneratorService.js.map