/**
 * Sales Assist Service - AI-powered sales assistance business logic
 */

import OpenAI from "openai";
import * as vendorsRepository from "../../vendors/repositories/vendorsRepository.js";
import * as vendorPricingRepository from "../repositories/vendorPricingRepository.js";
import * as leadsRepository from "../../leads/repositories/leadsRepository.js";
import * as vendorConversationLogRepository from "../repositories/vendorConversationLogRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs.js";
import * as quoteAIRateService from "../../quotes/services/quoteAIRateService.js";
import { getStateTaxRate } from "../../../constants/tax/stateTaxRates.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";
import {
  roundPrice,
  applyMultiplier,
  addMargin,
  calculatePriceDifferencePercentage,
  calculateAccuracyRating,
  abs,
} from "../../../utils/priceCalculations.js";

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for AI sales assistance"
      );
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

const DEFAULT_MARGIN_AMOUNT = 50; // Fixed $50 margin on vendor pricing

/**
 * Analyze conversation transcript to extract intent and key information
 * Also identifies speaker roles (Operator vs Customer) based on conversation context
 * @param {string} transcript - The conversation transcript
 * @param {Object} context - Additional context (operator name, etc.)
 * @returns {Object} - Extracted information and intent
 */
export const analyzeConversation = async (transcript, context = {}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const mode = (context as any).mode || "sales"; // "sales" or "vendor"
    const isVendorMode = mode === "vendor";

    // Mode-aware system prompt - speakers are already identified by audio source
    const systemPrompt = isVendorMode
      ? `You are an AI assistant helping a porta potty rental business analyze vendor conversations. 

Your tasks:
1. Extract key information from the conversation

The transcript is already labeled with speaker roles:
- [Operator] = FJ Rep (FlushJohn Sales Representative) - asking vendor for quotes/pricing
- [Customer] = Vendor Rep (Vendor Sales Representative) - providing quotes/pricing

You do NOT need to identify speakers - they are already correctly labeled by audio source.

Focus on extracting:
- Pricing information quoted by the vendor
- Service details and availability
- Delivery options and timelines
- Any negotiation points or special terms

Return a JSON object with:
- intent, location, eventType, quantity, dates, questions, tone, summary
- Note: speakerRoles is not needed since speakers are already identified`
      : `You are an AI assistant helping a porta potty rental business analyze customer conversations. 

Your tasks:
1. Extract key information from the conversation

The transcript is already labeled with speaker roles:
- [Operator] = FJ Rep (FlushJohn Sales Representative) - providing service and pricing
- [Customer] = Lead (Potential Customer) - requesting service and asking questions

You do NOT need to identify speakers - they are already correctly labeled by audio source.

Focus on extracting:
- Customer's location and delivery address
- Event type and dates
- Quantity of units needed
- Specific requirements or questions
- Customer intent (rental, quote request, etc.)

Return a JSON object with:
- intent, location, eventType, quantity, dates, questions, tone, summary
- Note: speakerRoles is not needed since speakers are already identified`;

    const userPrompt = `Analyze this conversation transcript:

${transcript}

${
  (context as any).operatorName
    ? `Note: The operator's name is ${(context as any).operatorName}.`
    : ""
}

Identify speaker roles based on what each person says, then extract the relevant information.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const extractedInfo: any = JSON.parse(
      completion.choices[0].message.content
    );

    return {
      intent: extractedInfo.intent || null,
      location: extractedInfo.location || null,
      eventType: extractedInfo.eventType || null,
      quantity: extractedInfo.quantity || null,
      dates: extractedInfo.dates || null,
      questions: extractedInfo.questions || [],
      tone: extractedInfo.tone || null,
      summary: extractedInfo.summary || null,
    };
  } catch (error) {
    console.error("Error in analyzeConversation:", error);
    throw new Error(`Failed to analyze conversation: ${error.message}`);
  }
};

/**
 * Get vendor pricing based on location and event details
 * @param {Object} params - Location and event parameters
 * @returns {Object} - Vendor pricing information
 */
export const getVendorPricing = async ({
  zipCode,
  city,
  state,
  eventType,
  quantity = 1,
  productItem = "Standard Porta Potty", // Default product item for sales assist
}) => {
  try {
    let query = {};

    if (zipCode) {
      (query as any).$or = [
        { serviceZipCodes: { $regex: zipCode, $options: "i" } },
        { zip: zipCode },
      ];
    }

    if (city) {
      if (!(query as any).$or) (query as any).$or = [];
      (query as any).$or.push({ city: { $regex: city, $options: "i" } });
      (query as any).$or.push({
        serviceCities: { $regex: city, $options: "i" },
      });
    }

    if (state) {
      if (!(query as any).$or) (query as any).$or = [];
      (query as any).$or.push({ state: { $regex: state, $options: "i" } });
      (query as any).$or.push({
        serviceStates: { $regex: state, $options: "i" },
      });
    }

    const vendors = await vendorsRepository.findAll({
      query:
        (query as any).$or && (query as any).$or.length > 0
          ? { $or: (query as any).$or }
          : query,
      sort: { createdAt: -1 },
      skip: 0,
      limit: 10,
    });

    if (!vendors || (Array.isArray(vendors) && vendors.length === 0)) {
      return {
        vendors: [],
        averagePrice: null,
        recommendedPrice: null,
        message:
          "No vendors found for this location. You may need to search manually.",
      };
    }

    let aiSuggestedRate = null;
    let vendorBasePrice = null;
    let averagePrice = null;
    let recommendedPrice = null;
    let historicalData: {
      sampleSize: number;
      isHistoricalData: boolean;
      message: string;
      confidence?: number | null;
    } = {
      sampleSize: 0,
      isHistoricalData: false,
      message: "Using AI-powered pricing estimation.",
    };

    try {
      aiSuggestedRate = await quoteAIRateService.getAISuggestedRate({
        zipCode,
        city,
        state,
        streetAddress: null,
        productItem,
        quantity,
        usageType: eventType,
      });

      vendorBasePrice = aiSuggestedRate.vendorCostEstimate || null;
      const suggestedRatePerUnit = aiSuggestedRate.suggestedRatePerUnit;

      // Use utility function for consistent calculation
      averagePrice = parseFloat(
        calculateProductAmount(quantity, suggestedRatePerUnit)
      );
      recommendedPrice = averagePrice;
      if (aiSuggestedRate.dataSources) {
        historicalData = {
          sampleSize: aiSuggestedRate.dataSources.historicalSamples || 0,
          isHistoricalData: aiSuggestedRate.dataSources.historicalSamples > 0,
          message:
            aiSuggestedRate.dataSources.historicalSamples > 0
              ? `Using historical data (${aiSuggestedRate.dataSources.historicalSamples} samples)`
              : "Using AI-powered pricing estimation based on regional factors.",
          confidence: (aiSuggestedRate as any).confidence,
        };
      }
    } catch (error) {
      console.error("Error fetching AI suggested rate:", error);
      const basePricePerUnit = 150;
      const eventTypeMultiplier =
        eventType === "construction"
          ? 0.9
          : eventType === "wedding"
            ? 1.2
            : 1.0;

      vendorBasePrice = applyMultiplier(basePricePerUnit, eventTypeMultiplier);
      // Use utility function for consistent calculation
      averagePrice = parseFloat(
        calculateProductAmount(quantity, vendorBasePrice)
      );
      recommendedPrice = addMargin(averagePrice, DEFAULT_MARGIN_AMOUNT);

      historicalData.message =
        "Using fallback pricing (AI service unavailable)";
    }

    const vendorsArray = Array.isArray(vendors) ? vendors : [];

    return {
      vendors: vendorsArray.map((v) => ({
        id: v._id,
        name: v.name || v.cName,
        city: v.city,
        state: v.state,
        zip: v.zip,
        phone: v.phone,
        email: v.email,
      })),
      averagePrice: roundPrice(averagePrice),
      vendorBasePrice: vendorBasePrice ? roundPrice(vendorBasePrice) : null,
      margin: DEFAULT_MARGIN_AMOUNT,
      marginAmount: DEFAULT_MARGIN_AMOUNT,
      recommendedPrice: roundPrice(recommendedPrice),
      quantity,
      message: `Found ${vendorsArray.length} vendor(s) serving this location`,
      historicalData,
      aiSuggestedRate: aiSuggestedRate
        ? {
            suggestedRatePerUnit: aiSuggestedRate.suggestedRatePerUnit,
            confidence: aiSuggestedRate.confidence,
            reasoning: aiSuggestedRate.reasoning,
          }
        : null,
    };
  } catch (error) {
    console.error("Error in getVendorPricing:", error);
    throw new Error(`Failed to get vendor pricing: ${error.message}`);
  }
};

/**
 * Generate a suggested response for the operator
 * @param {Object} params - Response generation parameters
 * @returns {Object} - Suggested response
 */
export const generateResponseSuggestion = async ({
  customerQuery,
  extractedInfo,
  pricing,
}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const systemPrompt = `You are an AI assistant helping a porta potty rental operator respond to customers. 
Generate professional, helpful, and friendly responses that:
1. Address the customer's question directly
2. Provide pricing information if available
3. Ask for missing information if needed
4. Maintain a sales-oriented but not pushy tone
5. Keep responses concise (2-3 sentences maximum)

Be professional, friendly, and focused on helping the customer.`;

    let userPrompt = `Customer query: "${customerQuery}"\n\n`;

    if (extractedInfo) {
      userPrompt += `Extracted information:\n`;
      if ((extractedInfo as any).location)
        userPrompt += `- Location: ${JSON.stringify(
          (extractedInfo as any).location
        )}\n`;
      if ((extractedInfo as any).eventType)
        userPrompt += `- Event Type: ${(extractedInfo as any).eventType}\n`;
      if ((extractedInfo as any).quantity)
        userPrompt += `- Quantity: ${(extractedInfo as any).quantity}\n`;
    }

    if (pricing) {
      userPrompt += `\nPricing Information:\n`;
      userPrompt += `- Recommended Price: $${pricing.recommendedPrice}\n`;
      if (pricing.quantity) userPrompt += `- Quantity: ${pricing.quantity}\n`;
      userPrompt += `- Found ${
        pricing.vendors?.length || 0
      } vendor(s) in the area\n`;
    }

    userPrompt += `\nGenerate a suggested response for the operator to say to the customer.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const suggestedResponse = completion.choices[0].message.content.trim();

    return {
      suggestedResponse,
      keyPoints: extractKeyPoints(suggestedResponse),
    };
  } catch (error) {
    console.error("Error in generateResponseSuggestion:", error);
    throw new Error(`Failed to generate response suggestion: ${error.message}`);
  }
};

/**
 * Submit actual vendor quote to improve pricing accuracy
 * @param {Object} quoteData - Vendor quote information
 * @returns {Object} - Saved quote with comparison data
 */
export const submitVendorQuote = async (quoteData) => {
  try {
    const {
      vendorId,
      vendorName,
      zipCode,
      city,
      state,
      eventType,
      quantity,
      pricePerUnit,
      totalPrice,
      additionalCharges,
      quotedBy,
      notes,
      source,
      aiSuggestedPrice,
    } = quoteData;

    let priceDifference = null;
    let accuracyRating = null;

    if (aiSuggestedPrice) {
      priceDifference = totalPrice - aiSuggestedPrice;
      const differencePercentage = abs(
        calculatePriceDifferencePercentage(aiSuggestedPrice, totalPrice)
      );
      accuracyRating = calculateAccuracyRating(aiSuggestedPrice, totalPrice);
    }

    const pricingHistory = {
      vendorId: vendorId || null,
      vendorName,
      zipCode,
      city,
      state,
      eventType,
      quantity,
      pricePerUnit,
      totalPrice,
      additionalCharges,
      quotedBy,
      notes,
      source,
      aiSuggestedPrice,
      priceDifference,
      accuracyRating,
      quotedDate: getCurrentDateTime(),
    };

    const savedQuote = await vendorPricingRepository.create(pricingHistory);

    return {
      id: savedQuote._id,
      ...pricingHistory,
      comparison: aiSuggestedPrice
        ? {
            suggestedPrice: aiSuggestedPrice,
            actualPrice: totalPrice,
            difference: priceDifference,
            accuracy: roundPrice(accuracyRating),
            message:
              accuracyRating > 90
                ? "AI suggestion was very accurate!"
                : accuracyRating > 70
                  ? "AI suggestion was reasonably close"
                  : "AI suggestion differed significantly - system will learn from this",
          }
        : null,
    };
  } catch (error) {
    console.error("Error in submitVendorQuote:", error);
    throw new Error(`Failed to submit vendor quote: ${error.message}`);
  }
};

/**
 * Generate vendor call suggestions based on lead data
 * Provides AI-generated conversation guide for calling vendors
 * @param {String} leadId - Lead ID to fetch from database
 * @returns {Object} - Vendor call suggestions and script
 */
export const generateVendorCallSuggestions = async (leadId) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    // Fetch lead data from database
    const leadData = await leadsRepository.findById(leadId);

    if (!leadData) {
      throw new Error("Lead not found");
    }

    // Convert Mongoose document to plain object if needed
    const lead = leadData.toObject ? leadData.toObject() : leadData;

    const systemPrompt = `You are an AI assistant helping a porta potty rental business operator prepare for vendor calls.
Your goal is to help the operator get the best quotation from vendors by providing:
1. An effective opening statement to introduce the request
2. Key questions to ask the vendor to get accurate pricing
3. Important pricing discussion points to cover
4. Negotiation tips to get competitive rates
5. A professional closing statement

Based on the lead information provided, generate a strategic call guide that will help the operator:
- Get accurate pricing quotes from vendors
- Understand all costs (delivery, pickup, rental period, etc.)
- Negotiate better rates
- Ensure vendor availability for the required dates
- Get all necessary details to provide the customer with a competitive quote

The call guide should be professional, clear, and focused on gathering the information needed to quote the customer accurately while maintaining good vendor relationships.`;

    const userPrompt = `Generate a vendor call guide for the following lead:

Customer Information:
${lead.fName ? `- Name: ${lead.fName} ${lead.lName || ""}` : ""}
${lead.email ? `- Email: ${lead.email}` : ""}
${lead.phone ? `- Phone: ${lead.phone}` : ""}

Location:
${lead.zip ? `- ZIP Code: ${lead.zip}` : ""}
${lead.city ? `- City: ${lead.city}` : ""}
${lead.state ? `- State: ${lead.state}` : ""}
${lead.streetAddress ? `- Address: ${lead.streetAddress}` : ""}

Event Details:
${lead.usageType ? `- Event Type: ${lead.usageType}` : ""}
${lead.deliveryDate ? `- Delivery Date: ${lead.deliveryDate}` : ""}
${lead.pickupDate ? `- Pickup Date: ${lead.pickupDate}` : ""}
${
  lead.deliveryDate && lead.pickupDate
    ? `- Duration: Calculate from delivery and pickup dates`
    : ""
}
${
  lead.products && Array.isArray(lead.products) && lead.products.length > 0
    ? `- Products/Quantity: ${lead.products.length} item(s) requested`
    : ""
}
${lead.instructions ? `- Special Instructions: ${lead.instructions}` : ""}

Please provide a comprehensive call guide in JSON format with the following structure:
{
  "openingStatement": "A professional opening statement to start the call (2-3 sentences)",
  "questions": ["Question 1 to ask vendor", "Question 2 about pricing", "Question 3 about availability", ...],
  "pricingPoints": ["Important pricing detail to discuss", "Cost factor to consider", ...],
  "negotiationTips": ["Specific tip for getting best price", "Strategy tip", ...],
  "closingStatement": "A professional closing statement to end the call (2-3 sentences)"
}

Focus on:
- Getting accurate pricing per unit
- Understanding all additional costs (delivery fees, pickup fees, etc.)
- Confirming availability for the required dates
- Negotiating competitive rates
- Getting complete information to create an accurate quote for the customer
- Maintaining professional vendor relationships`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const suggestions = JSON.parse(completion.choices[0].message.content);

    return {
      openingStatement: suggestions.openingStatement || "",
      questions: Array.isArray(suggestions.questions)
        ? suggestions.questions
        : [],
      pricingPoints: Array.isArray(suggestions.pricingPoints)
        ? suggestions.pricingPoints
        : [],
      negotiationTips: Array.isArray(suggestions.negotiationTips)
        ? suggestions.negotiationTips
        : [],
      closingStatement: suggestions.closingStatement || "",
    };
  } catch (error) {
    console.error("Error in generateVendorCallSuggestions:", error);
    throw new Error(
      `Failed to generate vendor call suggestions: ${error.message}`
    );
  }
};

/**
 * Extract key points from a response (helper function)
 */
const extractKeyPoints = (response) => {
  const points = [];
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 10) {
      points.push(trimmed);
    }
  });

  return points.slice(0, 3); // Return up to 3 key points
};

/**
 * Generate real-time response for operator to read aloud
 * This is the core function for the AI Sales Assistant
 * @param {Object} params - Parameters for response generation
 * @param {string} params.mode - "sales" or "vendor" mode
 * @returns {Object} - Response for operator and pricing breakdown
 */
export const generateRealTimeResponse = async ({
  transcript,
  conversationHistory = [],
  extractedInfo = {},
  leadId = null,
  mode = "sales",
}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    // Get state for tax calculation
    const state = (extractedInfo as any)?.location?.state || null;
    const taxRate = getStateTaxRate(state);

    // Note: Learning from past conversations happens AFTER conversations are saved
    // Real-time responses use prompt engineering only for faster response times

    const isVendorMode = mode === "vendor";

    // Build the comprehensive system prompt based on mode
    const systemPrompt = isVendorMode
      ? `ROLE: You are an AI assistant helping a porta potty rental business operator communicate with vendor sales representatives to get quotes and pricing.

YOUR RESPONSIBILITIES:
1. CALL ASSISTANCE: Listen to the live conversation between the operator (FJ Rep) and vendor sales representative, understand what pricing and services the vendor is offering.
2. REAL-TIME SUGGESTIONS: Display suggested responses and questions to the operator so they can effectively negotiate and gather pricing information from vendors. Generate EXACTLY what to say.
3. GATHER VENDOR INFORMATION: Help the operator collect accurate pricing, availability, delivery options, and terms from vendors.
4. LEARN AND IMPROVE: Analyze vendor conversations to identify effective negotiation tactics and pricing patterns that can be applied to customer sales calls.

CONTEXT:
- The operator is calling vendors to get quotes for customer orders
- You need to help ask the right questions to get complete pricing information
- Focus on: price per unit, delivery fees, pickup fees, availability, minimum quantities, payment terms
- Be professional but efficient - vendors are business partners, not customers

LANGUAGE & ACCENT REQUIREMENTS:
- Write in natural US English (American spelling and phrasing)
- Use casual, friendly American expressions and idioms
- Write responses that are EASY TO READ ALOUD with a US accent
- Use contractions naturally: "we'll", "you're", "that's", "doesn't"
- Include natural filler phrases: "Absolutely!", "Sure thing!", "Perfect!", "You got it!"
- Avoid formal/stiff language - sound like a friendly American salesperson
- Example phrases: "Awesome!", "No problem at all", "Let me get you taken care of"

CRITICAL: PHONETIC-STYLE SPELLING REQUIRED
- Write ALL responses in phonetic spelling that shows how native Americans actually pronounce words
- Use phonetic spelling, NOT standard spelling
- Examples:
  * "I am" → "Ahm" or "I'm"
  * "going to" → "goin' tuh" or "gonna"
  * "the" → "thuh" (before consonants) or "thee" (before vowels)
  * "you" → "ya" or "yuh" (casual)
  * "want to" → "wanna"
  * "have to" → "hafta"
  * "got to" → "gotta"
  * "about" → "uh-bout" or "bout"
  * "because" → "cuz" or "cause"
  * "probably" → "probly" or "prolly"
  * "delivery" → "delivree" or "duhlivree"
  * "definitely" → "definitly" or "definitlee"
  * "absolutely" → "absolutly" or "absolootly"
- Use apostrophes naturally for dropped sounds: "goin'", "nothin'", "comin'"
- Keep it natural and readable - don't overcomplicate
- Balance phonetic accuracy with readability

NATURAL HUMAN CONVERSATION PATTERNS:
- Use natural transitions: "So", "Alright", "Well", "Yeah", "Okay"
- Mix short and medium sentences (vary length)
- Use contractions naturally: "we're", "you're", "that's", "doesn't"
- Start sentences with conjunctions when natural: "And", "But", "So"
- Use simple acknowledgments: "Yeah", "Right", "Gotcha", "Sounds good"
- Keep it conversational, not scripted
- Avoid overly formal language ("I understand your concern" → "Gotcha" or "I see")
- Avoid repetitive sentence patterns
- Examples:
  * "I understand you need porta potties" → "Oh yeah, we kin help ya out with that. What kinda event ya got goin' on?"
  * "Based on your requirements" → "Alright, so tell me whatcha need, an' I'll git ya a price."
  * "I would be happy to assist" → "Yeah, we kin handle that. When're ya needin' 'em?"

VENDOR MODE - YOUR GOALS (in order):
1. Greet professionally and introduce the request
2. Provide vendor with: event type, location (zip/address), delivery & pickup dates, quantity needed
3. Ask for complete pricing breakdown: price per unit, delivery fees, pickup fees, any additional charges
4. Confirm availability for the required dates
5. Ask about payment terms, minimum quantities, or special requirements
6. Thank them and confirm next steps

RULES FOR VENDOR MODE:
- Be professional and efficient
- Ask specific questions to get complete pricing information
- Confirm all costs upfront (no surprises)
- Verify availability before committing
- Keep responses concise and focused on gathering information
- Sound like a professional business operator
- Keep sentences short and easy to read aloud

RESPONSE FORMAT:
Return a JSON object with:
{
  "response": "The exact words in PHONETIC SPELLING the operator should say. Must sound like a real human conversation, not an AI. Use natural sentence framing, conversational flow, and avoid robotic patterns. Example: 'Oh yeah, we kin definitly help ya out with that. What dates were ya thinkin'?'",
  "pricingBreakdown": null (vendor mode - pricing comes from vendor, not calculated),
  "nextAction": "what the operator should do next (e.g., 'wait for address', 'confirm booking', 'ask about delivery fees', etc.)",
  "confidence": "high/medium/low"
}

In vendor mode, pricingBreakdown should always be null - we're gathering pricing from the vendor, not calculating it.`
      : `ROLE: You are an AI assistant integrated into a CRM for a porta potty rental business that operates as a broker. We do not own the porta potties ourselves but connect customers with local vendors who provide the service.

YOUR RESPONSIBILITIES:
1. CALL ASSISTANCE: Listen to the live conversation between the operator and customer, distinguish who is speaking, and understand what the customer needs.
2. REAL-TIME SUGGESTIONS: Display suggested responses and pricing to the operator so they can smoothly answer the customer. Generate EXACTLY what to say.
3. MAINTAIN ILLUSION OF DIRECT SERVICE: The customer must feel like they are dealing directly with our company, NOT a third-party vendor. All responses should maintain that impression.
4. LEARN AND IMPROVE: Analyze conversations to identify successful patterns. Over time, become even MORE knowledgeable than the operator to optimize every aspect of the sales process.

LANGUAGE & ACCENT REQUIREMENTS:
- Write in natural US English (American spelling and phrasing)
- Use casual, friendly American expressions and idioms
- Write responses that are EASY TO READ ALOUD with a US accent
- Use contractions naturally: "we'll", "you're", "that's", "doesn't"
- Include natural filler phrases: "Absolutely!", "Sure thing!", "Perfect!", "You got it!"
- Avoid formal/stiff language - sound like a friendly American salesperson
- Example phrases: "Awesome!", "No problem at all", "Let me get you taken care of"

CRITICAL: Present as a DIRECT service provider. NEVER mention:
- Vendors, suppliers, or third parties
- "Let me check with..." or "I need to confirm with..."
- Anything that suggests we don't own the units ourselves
Use "we", "our team", "our units", "our service area"

CRITICAL: PHONETIC-STYLE SPELLING REQUIRED
- Write ALL responses in phonetic spelling that shows how native Americans actually pronounce words
- Use phonetic spelling, NOT standard spelling
- Examples:
  * "I am" → "Ahm" or "I'm"
  * "going to" → "goin' tuh" or "gonna"
  * "the" → "thuh" (before consonants) or "thee" (before vowels)
  * "you" → "ya" or "yuh" (casual)
  * "want to" → "wanna"
  * "have to" → "hafta"
  * "got to" → "gotta"
  * "about" → "uh-bout" or "bout"
  * "because" → "cuz" or "cause"
  * "probably" → "probly" or "prolly"
  * "delivery" → "delivree" or "duhlivree"
  * "definitely" → "definitly" or "definitlee"
  * "absolutely" → "absolutly" or "absolootly"
- Use apostrophes naturally for dropped sounds: "goin'", "nothin'", "comin'"
- Keep it natural and readable - don't overcomplicate
- Balance phonetic accuracy with readability

NATURAL HUMAN CONVERSATION PATTERNS:
- Use natural transitions: "So", "Alright", "Well", "Yeah", "Okay"
- Mix short and medium sentences (vary length)
- Use contractions naturally: "we're", "you're", "that's", "doesn't"
- Start sentences with conjunctions when natural: "And", "But", "So"
- Use simple acknowledgments: "Yeah", "Right", "Gotcha", "Sounds good"
- Keep it conversational, not scripted
- Avoid overly formal language ("I understand your concern" → "Gotcha" or "I see")
- Avoid repetitive sentence patterns
- Examples:
  * "I understand you need porta potties" → "Oh yeah, we kin help ya out with that. What kinda event ya got goin' on?"
  * "Based on your requirements" → "Alright, so tell me whatcha need, an' I'll git ya a price."
  * "I would be happy to assist" → "Yeah, we kin handle that. When're ya needin' 'em?"

BUSINESS MODEL (internal - NEVER reveal to customer):
- We source from local vendors but present as our own service
- Fixed $50 margin on top of vendor cost (this is built into quotes, never mentioned)
- Base pricing: ~$150/unit for standard porta potty

PRICING BREAKDOWN (always itemize for customer):
1. Unit rental: $150 per unit base price
   - Construction sites: 10% discount ($135/unit)
   - Weddings/special events: 20% premium ($180/unit)
2. Delivery charge: Estimate based on distance (typically $50-150)
3. Fuel surcharge: Regional estimate ($10-25)
4. Sales tax: ${taxRate}% for ${state || "this state"}
5. Our $50 margin is BUILT INTO the unit price - NEVER mention it separately

YOUR GOALS (in order):
1. Greet professionally and warmly
2. Collect: event type, location (zip/address), delivery & pickup dates, quantity needed
3. Quote price with FULL BREAKDOWN (units, delivery, fuel, tax)
4. Handle objections confidently
5. Close the sale - always ask for the booking!

RULES:
- NEVER mention vendors, suppliers, or third parties
- Use "we", "our team", "our units"
- Never say "let me check" - you know the pricing
- Always provide itemized breakdown when quoting
- Be confident and direct with prices
- If they hesitate on price, offer payment flexibility, NOT discounts
- Always ask for the sale
- Sound like a native US English speaker - friendly, confident, helpful
- Keep sentences short and easy to read aloud

RESPONSE FORMAT:
Return a JSON object with:
{
  "response": "The exact words in PHONETIC SPELLING the operator should say. Must sound like a real human conversation, not an AI. Use natural sentence framing, conversational flow, and avoid robotic patterns. Example: 'Oh yeah, we kin definitly help ya out with that. What dates were ya thinkin'?'",
  "pricingBreakdown": {
    "units": { "quantity": number, "pricePerUnit": number, "total": number },
    "delivery": number,
    "fuelSurcharge": number,
    "subtotal": number,
    "taxRate": number,
    "taxAmount": number,
    "margin": 50,
    "grandTotal": number
  },
  "nextAction": "what the operator should do next (e.g., 'wait for address', 'confirm booking', etc.)",
  "confidence": "high/medium/low"
}

If pricing cannot be calculated yet (missing info), set pricingBreakdown to null.`;

    // Build the user prompt with conversation context
    let userPrompt = `Current conversation transcript:\n${transcript}\n\n`;

    if (extractedInfo && Object.keys(extractedInfo).length > 0) {
      userPrompt += `Information extracted so far:\n`;
      if ((extractedInfo as any).location)
        userPrompt += `- Location: ${JSON.stringify(
          (extractedInfo as any).location
        )}\n`;
      if ((extractedInfo as any).eventType)
        userPrompt += `- Event Type: ${(extractedInfo as any).eventType}\n`;
      if ((extractedInfo as any).quantity)
        userPrompt += `- Quantity: ${(extractedInfo as any).quantity}\n`;
      if ((extractedInfo as any).dates)
        userPrompt += `- Dates: ${JSON.stringify(
          (extractedInfo as any).dates
        )}\n`;
      userPrompt += "\n";
    }

    userPrompt += `Generate the next response in PHONETIC-STYLE SPELLING that shows how native Americans actually pronounce the words.
Example: "Oh yeah, we kin definitly help ya out with that" instead of "I can definitely help you with that".

CRITICAL REQUIREMENTS:
1. Use phonetic spelling (e.g., "Ahm goin' tuh help ya" not "I am going to help you")
2. Sound like a REAL HUMAN having a conversation, NOT an AI assistant
3. Use natural sentence framing - avoid formal/robotic patterns
4. Include conversational elements: "Oh yeah", "Alright", "So", "Gotcha"
5. Vary sentence length and structure
6. Use contractions and casual language naturally
7. Keep it natural and readable - no stress markers or excessive formatting

AVOID:
- Overly formal language ("I understand your concern" → "Gotcha" or "I see")
- Repetitive sentence patterns
- Too structured/scripted sounding

IMPORTANT: When using phrases learned from vendor conversations, convert them to phonetic spelling and keep them conversational.
For example, if vendor learning says "I can definitely help with that", use "Yeah, we kin definitly help ya out with that" (phonetic + natural).`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-10), // Include last 10 messages for context
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      response: result.response || "",
      pricingBreakdown: result.pricingBreakdown || null,
      nextAction: result.nextAction || "",
      confidence: result.confidence || "medium",
      extractedInfo: extractedInfo,
    };
  } catch (error) {
    console.error("Error in generateRealTimeResponse:", error);
    throw new Error(`Failed to generate real-time response: ${error.message}`);
  }
};

/**
 * Extract learnings from vendor conversation for AI training
 * @param {string} transcript - The vendor conversation transcript
 * @returns {Object} - Extracted learnings
 */
export const extractVendorLearnings = async (transcript) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const systemPrompt = `You are an AI analyst studying sales conversations between a porta potty rental company operator and vendor sales representatives.

Your task is to extract actionable learnings from this vendor conversation that can be applied to customer-facing sales calls.

Analyze the conversation and extract:

1. EFFECTIVE PHRASES: Short, impactful phrases the vendor uses that could be adapted for customer sales
   - Greetings and rapport building
   - Pricing presentation phrases
   - Confidence-building statements
   - Closing phrases

2. NEGOTIATION TACTICS: Strategies used by the vendor during the conversation
   - How they present pricing
   - How they handle objections
   - How they create urgency
   - How they upsell or add value

3. PRICING STRATEGIES: How the vendor discusses and presents pricing
   - Bundling techniques
   - Discount positioning
   - Value justification

4. OBJECTION HANDLING: How objections or concerns are addressed
   - Common objections and responses
   - Reframing techniques

5. CLOSING TECHNIQUES: How the vendor attempts to close the deal
   - Assumptive closes
   - Urgency creation
   - Next steps positioning

6. TONE NOTES: Overall observations about communication style, accent patterns, and language that makes the vendor sound professional and trustworthy

Return a JSON object with these categories. Each category should contain an array of strings (except toneNotes which is a single string).`;

    const userPrompt = `Analyze this vendor conversation and extract learnings:

${transcript}

Return JSON with: effectivePhrases, negotiationTactics, pricingStrategies, objectionHandling, closingTechniques, toneNotes`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const learnings = JSON.parse(completion.choices[0].message.content);

    return {
      effectivePhrases: learnings.effectivePhrases || [],
      negotiationTactics: learnings.negotiationTactics || [],
      pricingStrategies: learnings.pricingStrategies || [],
      objectionHandling: learnings.objectionHandling || [],
      closingTechniques: learnings.closingTechniques || [],
      toneNotes: learnings.toneNotes || "",
    };
  } catch (error) {
    console.error("Error extracting vendor learnings:", error);
    throw new Error(`Failed to extract vendor learnings: ${error.message}`);
  }
};

/**
 * Extract learnings from sales conversation for AI training
 * @param {string} transcript - The sales conversation transcript
 * @returns {Object} - Extracted learnings
 */
export const extractSalesLearnings = async (transcript) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const systemPrompt = `You are an AI analyst studying sales conversations between a porta potty rental company sales representative (FJ Rep) and potential customers (Leads).

Your task is to extract actionable learnings from this sales conversation that can be applied to future customer sales calls.

Analyze the conversation and extract:

1. EFFECTIVE PHRASES: Short, impactful phrases the FJ Rep used that led to successful outcomes
   - Greetings and rapport building
   - Pricing presentation phrases
   - Confidence-building statements
   - Closing phrases
   - Value proposition statements

2. SALES TACTICS: Strategies used by the FJ Rep during the conversation
   - How they presented pricing
   - How they built rapport
   - How they created urgency
   - How they handled objections
   - How they closed the deal

3. OBJECTION HANDLING: How objections or concerns were addressed
   - Common objections and effective responses
   - Reframing techniques
   - Value justification methods

4. CLOSING TECHNIQUES: How the FJ Rep successfully closed the deal
   - Assumptive closes
   - Urgency creation
   - Next steps positioning
   - Commitment techniques

5. PRICING STRATEGIES: How pricing was presented and discussed
   - Value-based pricing presentation
   - Bundling techniques
   - Payment flexibility options

6. TONE NOTES: Overall observations about communication style, accent patterns, and language that made the FJ Rep sound professional, trustworthy, and effective

Return a JSON object with these categories. Each category should contain an array of strings (except toneNotes which is a single string).`;

    const userPrompt = `Analyze this sales conversation and extract learnings:

${transcript}

Return JSON with: effectivePhrases, salesTactics, objectionHandling, closingTechniques, pricingStrategies, toneNotes`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const learnings = JSON.parse(completion.choices[0].message.content);

    return {
      effectivePhrases: learnings.effectivePhrases || [],
      salesTactics: learnings.salesTactics || [],
      objectionHandling: learnings.objectionHandling || [],
      closingTechniques: learnings.closingTechniques || [],
      pricingStrategies: learnings.pricingStrategies || [],
      toneNotes: learnings.toneNotes || "",
    };
  } catch (error) {
    console.error("Error extracting sales learnings:", error);
    throw new Error(`Failed to extract sales learnings: ${error.message}`);
  }
};

/**
 * Get vendor learnings context for AI prompt
 * @returns {string} - Formatted learning context for AI prompt
 */
export const getVendorLearningsContext = async () => {
  try {
    const [phrases, tactics] = await Promise.all([
      vendorConversationLogRepository.getEffectivePhrases(15),
      vendorConversationLogRepository.getNegotiationTactics(10),
    ]);

    if (!phrases.length && !tactics.length) {
      return "";
    }

    let context =
      "\nLEARNED FROM VENDOR CONVERSATIONS (apply these techniques in PHONETIC SPELLING):\n";

    if (phrases.length > 0) {
      context += `\nEffective phrases to use (convert to phonetic when using):\n${phrases
        .map((p) => `- "${p}" → Use phonetic version in response`)
        .join("\n")}\n`;
    }

    if (tactics.length > 0) {
      context += `\nNegotiation tactics (apply with phonetic spelling):\n${tactics
        .map((t) => `- ${t}`)
        .join("\n")}\n`;
    }

    context += `\nCRITICAL: When incorporating vendor-learned phrases into your response, convert them to phonetic-style spelling and make them sound natural/conversational.\n`;

    return context;
  } catch (error) {
    console.error("Error getting vendor learnings context:", error);
    return "";
  }
};
