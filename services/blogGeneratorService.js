/**
 * AI-Powered Blog Content Generator Service
 * Generates SEO-optimized blog posts for FlushJohn porta potty rentals
 */

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
// Constants - using hardcoded values for now
const websiteURL = "https://www.flushjohn.com";
const phone = { phone_number: "(877) 790-7062" };

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Content templates for different post types
const contentTemplates = {
  citySpecific: {
    systemPrompt: `You are a professional content writer specializing in SEO-optimized blog posts for the porta potty rental industry. Write comprehensive, engaging content that helps customers make informed decisions about porta potty rentals.

Your writing style should be:
- Professional yet approachable
- Informative and helpful
- SEO-optimized with natural keyword integration
- Focused on solving customer problems
- Include practical tips and actionable advice

Always include:
- Internal links to relevant pages (use format: <a href="/porta-potty-rental/[city]">link text</a>)
- FAQ section with 5 questions
- Strong call-to-action at the end
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`,

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
4. IMPORTANT: Return ONLY the HTML content without any code block wrappers (no backticks or code blocks)
5. Add internal links to:
   - City page: /porta-potty-rental/${city.toLowerCase().replace(/\s+/g, "-")}
   - Product pages: /rental-products/standard-porta-potty, /rental-products/luxury-restroom-trailer
   - Quote page: /quote
   - FAQ page: /faq
6. Include local information about ${city}, ${state}
7. Add practical tips and cost information
8. FAQ section with 5 questions relevant to ${city} porta potty rentals
9. Strong call-to-action mentioning same-day delivery in ${city}
10. Use HTML formatting for headings, lists, and links
11. Make it helpful for event planners, wedding organizers, and construction managers in ${city}

Write engaging, informative content that positions FlushJohn as the expert choice for porta potty rentals in ${city}.`,
  },

  industryGuide: {
    systemPrompt: `You are a professional content writer specializing in SEO-optimized industry guides for the porta potty rental business. Write comprehensive, authoritative content that establishes expertise and drives leads.

Your writing style should be:
- Expert and authoritative
- Highly informative with actionable advice
- SEO-optimized with natural keyword integration
- Include specific data, regulations, and best practices
- Focus on solving complex industry problems

Always include:
- Internal links to relevant pages
- FAQ section with 5 questions
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`,

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
4. Add internal links to:
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
5. Include specific industry data, regulations, or best practices
6. Add practical examples and case studies
7. FAQ section with 5 questions relevant to the topic
8. Strong call-to-action mentioning FlushJohn's expertise
9. Use HTML formatting for headings, lists, and links
10. Make it valuable for industry professionals, event planners, and construction managers

Write authoritative content that establishes FlushJohn as the industry expert.`,
  },

  seasonal: {
    systemPrompt: `You are a professional content writer specializing in seasonal SEO-optimized blog posts for the porta potty rental industry. Write timely, relevant content that addresses seasonal needs and trends.

Your writing style should be:
- Timely and relevant to the season
- Practical with seasonal tips
- SEO-optimized with natural keyword integration
- Include seasonal statistics and trends
- Focus on seasonal challenges and solutions

Always include:
- Internal links to relevant pages
- FAQ section with 5 questions
- Strong call-to-action
- Phone number: ${phone.phone_number}
- Quote link: <a href="/quote">Get Free Quote</a>`,

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
4. Add internal links to:
   - Product pages: /rental-products/
   - Quote page: /quote
   - Contact page: /contact
   - FAQ page: /faq
5. Include seasonal statistics, trends, and timing considerations
6. Add seasonal-specific tips and recommendations
7. FAQ section with 5 questions relevant to the seasonal topic
8. Strong call-to-action mentioning seasonal availability
9. Use HTML formatting for headings, lists, and links
10. Make it timely and valuable for seasonal planning

Write engaging content that helps customers plan for the ${season} season.`,
  },
};

// Generate blog post content using AI
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
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating blog content:", error);
    throw error;
  }
}

// Generate SEO-optimized meta description
export async function generateMetaDescription(title, content, keywords) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert. Generate compelling meta descriptions that are 150-160 characters, include primary keywords, and encourage clicks.",
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
- Make it click-worthy`,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating meta description:", error);
    return `Professional porta potty rental services. Get your free quote today! Call ${phone.phone_number}.`;
  }
}

// Generate SEO-friendly slug from title
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Generate excerpt from content
export function generateExcerpt(content, maxLength = 150) {
  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, "");

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last complete sentence within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf(".");

  if (lastSentence > maxLength * 0.7) {
    return plainText.substring(0, lastSentence + 1);
  }

  return truncated + "...";
}

// Extract tags from content and title
export function extractTags(title, content, city = null) {
  const baseTags = ["porta-potty-rental", "portable-toilets", "flushjohn"];

  if (city) {
    baseTags.push(city.toLowerCase().replace(/\s+/g, "-"));
  }

  // Extract additional tags from title and content
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

// Generate cover image alt text
export function generateCoverImageAlt(title, city = null) {
  const baseAlt = `FlushJohn porta potty rental services - ${title}`;
  return city ? `${baseAlt} in ${city}` : baseAlt;
}

export default {
  generateBlogContent,
  generateMetaDescription,
  generateSlug,
  generateExcerpt,
  extractTags,
  generateCoverImageAlt,
};
