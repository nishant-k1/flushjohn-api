/**
 * AI-Powered Blog Content Generator Service
 * Generates SEO-optimized blog posts for FlushJohn porta potty rentals
 */

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
const websiteURL = "https://www.flushjohn.com";
const phone = { phone_number: "(877) 790-7062" };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const citySpecificSystemPrompt = `You are a professional content writer specializing in SEO-optimized blog posts for the porta potty rental industry. Write comprehensive, engaging content that helps customers make informed decisions about porta potty rentals.

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
- FAQ section with 5 questions
- Strong call-to-action at the end
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;

const industryGuideSystemPrompt = `You are a professional content writer specializing in SEO-optimized industry guides for the porta potty rental business. Write comprehensive, authoritative content that establishes expertise and drives leads.

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
- FAQ section with 5 questions
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;

const seasonalSystemPrompt = `You are a professional content writer specializing in seasonal SEO-optimized blog posts for the porta potty rental industry. Write timely, relevant content that addresses seasonal needs and trends.

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
- FAQ section with 5 questions
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;

const caseStudySystemPrompt = `You are a professional content writer specializing in compelling case study blog posts for the porta potty rental industry. Write engaging, narrative-driven content that showcases real-world success stories and demonstrates FlushJohn's expertise.

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
- FAQ section with 5 questions
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`;

const contentTemplates = {
  citySpecific: {
    systemPrompt: citySpecificSystemPrompt,
    userPrompt: (title, city, state, keywords) => `
Write a comprehensive blog post with the following requirements:

Title: "${title}"
Target City: ${city}, ${state}
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}

Requirements:
1. Word count: 1800-2000 words
2. Structure: Introduction, 4-6 H2 sections, FAQ, Conclusion with CTA
3. Include the primary keyword in the title, first paragraph, and at least 2 H2 headings
4. CRITICAL: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper
5. Start directly with HTML tags (e.g., <h1>, <p>, <div>)
6. Add internal links to:
   - City page: /porta-potty-rental/${city.toLowerCase().replace(/\s+/g, "-")}
   - Product pages: /rental-products/standard-porta-potty, /rental-products/luxury-restroom-trailer
   - Quote page: /quote
   - FAQ page: /faq
7. Include local information about ${city}, ${state}
8. Add practical tips and cost information
9. FAQ section with 5 questions relevant to ${city} porta potty rentals
10. Strong call-to-action mentioning same-day delivery in ${city}
11. Use HTML formatting for headings, lists, and links
12. Make it helpful for event planners, wedding organizers, and construction managers in ${city}

OUTPUT FORMAT: Return the HTML content directly without any wrapper or code block formatting.

Write engaging, informative content that positions FlushJohn as the expert choice for porta potty rentals in ${city}.`,
  },

  industryGuide: {
    systemPrompt: industryGuideSystemPrompt,
    userPrompt: (title, keywords, focus) => `
Write a comprehensive industry guide with the following requirements:

Title: "${title}"
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}
Focus Area: ${focus}

Requirements:
1. Word count: 1800-2000 words
2. Structure: Introduction, 4-6 H2 sections, FAQ, Conclusion with CTA
3. Include the primary keyword in the title, first paragraph, and at least 2 H2 headings
4. CRITICAL: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper
5. Start directly with HTML tags (e.g., <h1>, <p>, <div>)
6. Add internal links to:
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
7. Include specific industry data, regulations, or best practices
8. Add practical examples and case studies
9. FAQ section with 5 questions relevant to the topic
10. Strong call-to-action mentioning FlushJohn's expertise
11. Use HTML formatting for headings, lists, and links
12. Make it valuable for industry professionals, event planners, and construction managers

OUTPUT FORMAT: Return the HTML content directly without any wrapper or code block formatting.

Write authoritative content that establishes FlushJohn as the industry expert.`,
  },

  seasonal: {
    systemPrompt: seasonalSystemPrompt,
    userPrompt: (title, keywords, season, focus) => `
Write a comprehensive seasonal blog post with the following requirements:

Title: "${title}"
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}
Season: ${season}
Focus: ${focus}

Requirements:
1. Word count: 1800-2000 words
2. Structure: Introduction, 4-6 H2 sections, FAQ, Conclusion with CTA
3. Include the primary keyword in the title, first paragraph, and at least 2 H2 headings
4. CRITICAL: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper
5. Start directly with HTML tags (e.g., <h1>, <p>, <div>)
6. Add internal links to:
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
7. Include seasonal statistics, trends, and timing considerations
8. Add seasonal-specific tips and recommendations
9. FAQ section with 5 questions relevant to the seasonal topic
10. Strong call-to-action mentioning seasonal availability
11. Use HTML formatting for headings, lists, and links
12. Make it timely and valuable for seasonal planning

OUTPUT FORMAT: Return the HTML content directly without any wrapper or code block formatting.

Write engaging content that helps customers plan for the ${season} season.`,
  },

  caseStudy: {
    systemPrompt: caseStudySystemPrompt,
    userPrompt: (title, keywords, focus) => `
Write a compelling case study blog post with the following requirements:

Title: "${title}"
Primary Keywords: ${keywords.primary}
Secondary Keywords: ${keywords.secondary}
Long-tail Keywords: ${keywords.longTail}
Focus Area: ${focus}

Requirements:
1. Word count: 1800-2000 words
2. Structure: Introduction, Challenge/Problem, Solution, Results, Client Feedback, FAQ, Conclusion with CTA
3. Include the primary keyword in the title, first paragraph, and at least 2 H2 headings
4. CRITICAL: Return ONLY raw HTML content - NO markdown code blocks, NO backticks, NO \`\`\`html wrapper
5. Start directly with HTML tags (e.g., <h1>, <p>, <div>)
6. Tell a compelling story with:
   - Specific scenario and context
   - Challenge or problem the client faced
   - How FlushJohn provided the solution
   - Quantifiable results (e.g., "10,000 attendees served", "same-day delivery", "100% satisfaction")
   - Client satisfaction or testimonial
7. Add internal links to:
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
8. Include specific details that make it realistic and credible
9. FAQ section with 5 questions relevant to similar situations
10. Strong call-to-action mentioning FlushJohn's proven track record
11. Use HTML formatting for headings, lists, and links
12. Make it inspiring and demonstrate FlushJohn's expertise and reliability

OUTPUT FORMAT: Return the HTML content directly without any wrapper or code block formatting.

Write a compelling case study that showcases FlushJohn's success in solving real challenges.`,
  },
};

export async function generateBlogContent(templateType, params) {
  try {
    const template = contentTemplates[templateType];
    if (!template) {
      throw new Error(`Invalid template type: ${templateType}`);
    }

    const response = await openai.chat.completions.create({
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
  } catch (error) {
    throw error;
  }
}

export async function generateMetaDescription(title, content, keywords) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert. Generate compelling meta descriptions that are 150-160 characters, include primary keywords, and encourage clicks. Return ONLY the meta description text without any code blocks or formatting.",
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
  } catch (error) {
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
export async function generateComprehensiveBlogMetadata(
  title,
  content,
  keywords,
  category
) {
  try {
    const response = await openai.chat.completions.create({
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
        coverImageAlt:
          parsedMetadata.coverImageAlt ||
          `Cover image for ${title}`.substring(0, 100),
        featured: Boolean(parsedMetadata.featured),
        priority: ["high", "medium", "low"].includes(parsedMetadata.priority)
          ? parsedMetadata.priority
          : "medium",
      };
    } catch (parseError) {
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
  } catch (error) {
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional image description expert. Generate detailed, SEO-optimized descriptions for blog cover images. Focus on visual elements that would appeal to the target audience and include relevant keywords naturally.",
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
  } catch (error) {
    console.error("Error generating cover image description:", error);
    return `Professional ${category} porta potty rental services - ${title}`.substring(
      0,
      100
    );
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert content writer. Generate a compelling, SEO-friendly excerpt (summary) for blog posts. The excerpt should be 120-150 characters, engaging, and capture the main value proposition. Return ONLY plain text without any HTML tags, quotes, backticks, or special formatting. Ensure the excerpt is optimized for both CRM display and public web SEO.",
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
  } catch (error) {
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
      "Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", // TX
      "Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", // FL
      "Los Angeles", "San Diego", "Sacramento", "San Jose", "Fresno", // CA
      "Atlanta", "Savannah", "Augusta", "Macon", "Columbus", // GA
      "Chicago", "Springfield", "Peoria", "Rockford", "Naperville", // IL
      "Dover", // DE
    ];

    const states = ["Texas", "TX", "Florida", "FL", "California", "CA", "Georgia", "GA", "Illinois", "IL", "Delaware", "DE"];

    // Check if any city is mentioned
    const mentionedCity = cities.find(city => {
      const cityLower = city.toLowerCase();
      const textLower = textSample.toLowerCase();
      // Check for city name (word boundary to avoid partial matches)
      return textLower.includes(cityLower) || 
             new RegExp(`\\b${cityLower}\\b`, 'i').test(textLower);
    });

    if (!mentionedCity) {
      return { city: null, state: null };
    }

    // Try to find state mentioned near the city
    const cityIndex = textSample.toLowerCase().indexOf(mentionedCity.toLowerCase());
    const surroundingText = textSample.substring(
      Math.max(0, cityIndex - 100),
      Math.min(textSample.length, cityIndex + mentionedCity.length + 100)
    ).toLowerCase();

    const mentionedState = states.find(state => {
      const stateLower = state.toLowerCase();
      return surroundingText.includes(`, ${stateLower}`) ||
             surroundingText.includes(`${stateLower}`) ||
             surroundingText.includes(` ${stateLower},`);
    });

    // Normalize state to full name or abbreviation
    let stateAbbr = null;
    if (mentionedState) {
      const stateMap = {
        "texas": "TX", "tx": "TX",
        "florida": "FL", "fl": "FL",
        "california": "CA", "ca": "CA",
        "georgia": "GA", "ga": "GA",
        "illinois": "IL", "il": "IL",
        "delaware": "DE", "de": "DE",
      };
      stateAbbr = stateMap[mentionedState.toLowerCase()] || mentionedState.toUpperCase().slice(0, 2);
    } else {
      // Try to infer state from city
      const cityStateMap = {
        "Houston": "TX", "Dallas": "TX", "Austin": "TX", "San Antonio": "TX", "Fort Worth": "TX",
        "Miami": "FL", "Orlando": "FL", "Tampa": "FL", "Jacksonville": "FL", "Fort Lauderdale": "FL",
        "Los Angeles": "CA", "San Diego": "CA", "Sacramento": "CA", "San Jose": "CA", "Fresno": "CA",
        "Atlanta": "GA", "Savannah": "GA", "Augusta": "GA", "Macon": "GA", "Columbus": "GA",
        "Chicago": "IL", "Springfield": "IL", "Peoria": "IL", "Rockford": "IL", "Naperville": "IL",
        "Dover": "DE",
      };
      stateAbbr = cityStateMap[mentionedCity] || null;
    }

    // Convert state abbreviation to full name for storage
    const stateFullNameMap = {
      "TX": "Texas",
      "FL": "Florida",
      "CA": "California",
      "GA": "Georgia",
      "IL": "Illinois",
      "DE": "Delaware",
    };
    const stateFullName = stateAbbr ? (stateFullNameMap[stateAbbr] || stateAbbr) : null;

    return {
      city: mentionedCity,
      state: stateFullName || stateAbbr,
    };
  } catch (error) {
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

  if (text.includes("wedding")) keywordTags.push("weddings");
  if (text.includes("construction")) keywordTags.push("construction");
  if (text.includes("event")) keywordTags.push("events");
  if (text.includes("festival")) keywordTags.push("festivals");
  if (text.includes("ada")) keywordTags.push("ada-compliant");
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

export default {
  generateBlogContent,
  generateMetaDescription,
  generateSlug,
  generateExcerpt,
  extractTags,
  extractCityAndState,
  generateCoverImageAlt,
};
