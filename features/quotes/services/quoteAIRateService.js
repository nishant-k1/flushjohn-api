/**
 * Quote AI Rate Service - AI-powered rate suggestions for quotes
 */

import OpenAI from "openai";
import * as vendorPricingRepository from "../../salesAssist/repositories/vendorPricingRepository.js";

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for AI rate suggestions"
      );
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

/**
 * Get AI suggested rate for a product in a quote based on location and historical data
 * @param {Object} params - Rate parameters
 * @param {string} params.zipCode - Zip code
 * @param {string} params.city - City
 * @param {string} params.state - State
 * @param {string} params.streetAddress - Street address (optional)
 * @param {string} params.productItem - Product/item name
 * @param {number} params.quantity - Quantity needed
 * @param {string} params.usageType - Usage type (construction, event, etc.) - optional
 * @returns {Object} - AI suggested rate with confidence level
 */
export const getAISuggestedRate = async ({
  zipCode,
  city,
  state,
  streetAddress,
  productItem,
  quantity = 1,
  usageType,
}) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    if (!zipCode && !city) {
      throw new Error("Location (zipCode or city) is required");
    }

    if (!productItem) {
      throw new Error("Product item is required");
    }

    const historicalData = {
      vendorPricing: [],
      jobOrders: [],
      salesOrders: [],
      quotes: [],
    };

    try {
      const vendorPricing = await vendorPricingRepository.findRecentPricing({
        zipCode,
        city,
        state,
        eventType: usageType,
        quantity,
        limit: 20,
      });
      if (vendorPricing && vendorPricing.length > 0) {
        historicalData.vendorPricing = vendorPricing.map((vp) => ({
          pricePerUnit: vp.pricePerUnit,
          totalPrice: vp.totalPrice,
          quantity: vp.quantity,
          eventType: vp.eventType,
          date: vp.createdAt,
          vendorName: vp.vendorName,
        }));
      }
    } catch (error) {
      console.error("Error fetching vendor pricing history:", error);
    }

    try {
      const JobOrders = (await import("../../jobOrders/models/JobOrders.js"))
        .default;

      const locationQuery = {};
      if (zipCode) {
        locationQuery["lead.zip"] = zipCode;
      } else if (city && state) {
        locationQuery["lead.city"] = { $regex: city, $options: "i" };
        locationQuery["lead.state"] = { $regex: state, $options: "i" };
      }

      const jobOrders = await JobOrders.find(locationQuery)
        .populate("lead")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (jobOrders && jobOrders.length > 0) {
        historicalData.jobOrders = jobOrders
          .filter((jo) => jo.products && Array.isArray(jo.products))
          .map((jo) => {
            const matchingProduct = jo.products.find(
              (p) =>
                p.item &&
                productItem &&
                p.item.toLowerCase().includes(productItem.toLowerCase())
            );
            if (matchingProduct) {
              return {
                pricePerUnit: matchingProduct.rate || 0,
                totalPrice: matchingProduct.amount || 0,
                quantity: matchingProduct.qty || 0,
                date: jo.createdAt,
                jobOrderNo: jo.jobOrderNo,
              };
            }
            return null;
          })
          .filter((item) => item !== null);
      }
    } catch (error) {
      console.error("Error fetching job orders:", error);
    }

    try {
      const SalesOrders = (
        await import("../../salesOrders/models/SalesOrders.js")
      ).default;

      const locationQuery = {};
      if (zipCode) {
        locationQuery["lead.zip"] = zipCode;
      } else if (city && state) {
        locationQuery["lead.city"] = { $regex: city, $options: "i" };
        locationQuery["lead.state"] = { $regex: state, $options: "i" };
      }

      const salesOrders = await SalesOrders.find(locationQuery)
        .populate("lead")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (salesOrders && salesOrders.length > 0) {
        historicalData.salesOrders = salesOrders
          .filter((so) => so.products && Array.isArray(so.products))
          .map((so) => {
            const matchingProduct = so.products.find(
              (p) =>
                p.item &&
                productItem &&
                p.item.toLowerCase().includes(productItem.toLowerCase())
            );
            if (matchingProduct) {
              return {
                pricePerUnit: matchingProduct.rate || 0,
                totalPrice: matchingProduct.amount || 0,
                quantity: matchingProduct.qty || 0,
                date: so.createdAt,
                salesOrderNo: so.salesOrderNo,
              };
            }
            return null;
          })
          .filter((item) => item !== null);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    }

    try {
      const Quotes = (await import("../models/Quotes.js")).default;

      const locationQuery = {};
      if (zipCode) {
        locationQuery["lead.zip"] = zipCode;
      } else if (city && state) {
        locationQuery["lead.city"] = { $regex: city, $options: "i" };
        locationQuery["lead.state"] = { $regex: state, $options: "i" };
      }

      const quotes = await Quotes.find(locationQuery)
        .populate("lead")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (quotes && quotes.length > 0) {
        historicalData.quotes = quotes
          .filter((q) => q.products && Array.isArray(q.products))
          .map((q) => {
            const matchingProduct = q.products.find(
              (p) =>
                p.item &&
                productItem &&
                p.item.toLowerCase().includes(productItem.toLowerCase())
            );
            if (matchingProduct) {
              return {
                pricePerUnit: matchingProduct.rate || 0,
                totalPrice: matchingProduct.amount || 0,
                quantity: matchingProduct.qty || 0,
                date: q.createdAt,
                quoteNo: q.quoteNo,
              };
            }
            return null;
          })
          .filter((item) => item !== null);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    }

    const totalSamples =
      historicalData.vendorPricing.length +
      historicalData.jobOrders.length +
      historicalData.salesOrders.length +
      historicalData.quotes.length;

    let confidence = "low";
    if (totalSamples >= 10) {
      confidence = "high";
    } else if (totalSamples >= 5) {
      confidence = "medium";
    }

    // Prepare data summary for AI
    const historicalSummary = {
      vendorPricingCount: historicalData.vendorPricing.length,
      jobOrdersCount: historicalData.jobOrders.length,
      salesOrdersCount: historicalData.salesOrders.length,
      quotesCount: historicalData.quotes.length,
      totalSamples,
      recentVendorPrices: historicalData.vendorPricing
        .slice(0, 5)
        .map((vp) => ({
          pricePerUnit: vp.pricePerUnit,
          quantity: vp.quantity,
          date: vp.date,
        })),
      recentJobOrderPrices: historicalData.jobOrders.slice(0, 5).map((jo) => ({
        pricePerUnit: jo.pricePerUnit,
        quantity: jo.quantity,
        date: jo.date,
      })),
    };

    let averageVendorCost = null;
    const allVendorCosts = [
      ...historicalData.vendorPricing.map((vp) => vp.pricePerUnit),
      ...historicalData.jobOrders.map((jo) => jo.pricePerUnit),
    ].filter((price) => price && price > 0);

    if (allVendorCosts.length > 0) {
      const sum = allVendorCosts.reduce((acc, price) => acc + price, 0);
      averageVendorCost = sum / allVendorCosts.length;
    }

    const systemPrompt = `You are an AI rate analyst for a porta potty rental business. Your task is to suggest a quote rate (per unit) for a rental item based on:
1. Historical rate data from the database
2. Your general knowledge about regional rate variations, market rates, cost of living, and supply/demand factors

CRITICAL BUSINESS RULE:
- The quote rate must be AT LEAST $50 above the vendor cost to ensure profit margin
- Formula: Suggested Rate = (Vendor Cost Estimate) + $50 minimum margin

Your response must be a JSON object with this exact structure:
{
  "suggestedRatePerUnit": number,
  "vendorCostEstimate": number,
  "margin": 50,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of how you calculated this",
  "dataSources": {
    "historicalSamples": number,
    "hasVendorPricing": boolean,
    "hasJobOrders": boolean
  }
}`;

    const userPrompt = `Location Details:
- Zip Code: ${zipCode || "Not provided"}
- City: ${city || "Not provided"}
- State: ${state || "Not provided"}
- Street Address: ${streetAddress || "Not provided"}
- Usage Type: ${usageType || "Not specified"}

Product Details:
- Item: ${productItem}
- Quantity: ${quantity}

Historical Data Available:
${JSON.stringify(historicalSummary, null, 2)}

${
  averageVendorCost
    ? `Average Vendor Cost from Historical Data: $${averageVendorCost.toFixed(
        2
      )} per unit`
    : "No historical vendor cost data available - use your general knowledge about porta potty rental rates in this region"
}

Calculate the AI suggested rate per unit. Consider:
1. Historical vendor costs (if available)
2. Regional rate factors (cost of living, market rates for ${
      city || state || "this area"
    })
3. Supply/demand dynamics
4. Event type factors (${usageType || "general"})
5. Ensure minimum $50 margin above vendor cost

Return ONLY valid JSON, no markdown, no code blocks.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent rates
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    let aiResponse;
    try {
      const content = completion.choices[0].message.content.trim();
      const cleanedContent = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      aiResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback calculation
      const fallbackVendorCost = averageVendorCost || 150;
      aiResponse = {
        suggestedRatePerUnit: Math.round((fallbackVendorCost + 50) * 100) / 100,
        vendorCostEstimate: Math.round(fallbackVendorCost * 100) / 100,
        margin: 50,
        confidence: confidence,
        reasoning: "Using fallback calculation due to AI parsing error",
        dataSources: {
          historicalSamples: totalSamples,
          hasVendorPricing: historicalData.vendorPricing.length > 0,
          hasJobOrders: historicalData.jobOrders.length > 0,
        },
      };
    }

    // Ensure minimum $50 margin
    if (aiResponse.vendorCostEstimate) {
      const minSuggestedRate = aiResponse.vendorCostEstimate + 50;
      if (aiResponse.suggestedRatePerUnit < minSuggestedRate) {
        aiResponse.suggestedRatePerUnit =
          Math.round(minSuggestedRate * 100) / 100;
        aiResponse.reasoning +=
          " (adjusted to meet minimum $50 margin requirement)";
      }
    }

    if (!aiResponse.confidence || aiResponse.confidence === "low") {
      aiResponse.confidence = confidence;
    }

    return {
      suggestedRatePerUnit:
        Math.round(aiResponse.suggestedRatePerUnit * 100) / 100,
      vendorCostEstimate: aiResponse.vendorCostEstimate
        ? Math.round(aiResponse.vendorCostEstimate * 100) / 100
        : null,
      margin: 50,
      confidence: aiResponse.confidence || confidence,
      reasoning:
        aiResponse.reasoning ||
        "Based on historical data and regional rate factors",
      dataSources: {
        historicalSamples: totalSamples,
        hasVendorPricing: historicalData.vendorPricing.length > 0,
        hasJobOrders: historicalData.jobOrders.length > 0,
        hasSalesOrders: historicalData.salesOrders.length > 0,
        hasQuotes: historicalData.quotes.length > 0,
      },
    };
  } catch (error) {
    console.error("Error in getAISuggestedPrice:", error);
    throw new Error(`Failed to get AI suggested price: ${error.message}`);
  }
};
