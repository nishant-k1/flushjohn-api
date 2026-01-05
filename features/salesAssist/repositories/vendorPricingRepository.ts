/**
 * Vendor Pricing History Repository - Database Access Layer
 */

import VendorPricingHistory from "../models/VendorPricingHistory.js";

export const create = async (pricingData) => {
  return await (VendorPricingHistory as any).create(pricingData);
};

export const findById = async (id) => {
  return await (VendorPricingHistory as any).findById(id);
};

export const findRecentPricing = async ({
  zipCode,
  city,
  state,
  eventType,
  quantity,
  limit = 10,
}) => {
  const query = {};

  if (zipCode) {
    query.zipCode = zipCode;
  } else if (city && state) {
    query.city = { $regex: city, $options: "i" };
    query.state = { $regex: state, $options: "i" };
  }

  if (eventType) {
    query.eventType = eventType;
  }

  // Find pricing within similar quantity range (±50% to account for variations)
  if (quantity) {
    query.quantity = {
      $gte: Math.floor(quantity * 0.5),
      $lte: Math.ceil(quantity * 1.5),
    };
  }

  return await (VendorPricingHistory as any).find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const findByVendorId = async (vendorId, limit = 10) => {
  return await (VendorPricingHistory as any).find({ vendorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const calculateAveragePricing = async ({
  zipCode,
  city,
  state,
  eventType,
  quantity,
}) => {
  const query = {};

  if (zipCode) {
    query.zipCode = zipCode;
  } else if (city && state) {
    query.city = { $regex: city, $options: "i" };
    query.state = { $regex: state, $options: "i" };
  }

  if (eventType) {
    query.eventType = eventType;
  }

  // Find pricing within similar quantity range
  if (quantity) {
    query.quantity = {
      $gte: Math.floor(quantity * 0.5),
      $lte: Math.ceil(quantity * 1.5),
    };
  }

  // Get recent pricing (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  query.createdAt = { $gte: ninetyDaysAgo };

  const pricingHistory = await (VendorPricingHistory as any).find(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!pricingHistory || pricingHistory.length === 0) {
    return null;
  }

  // Calculate average price per unit
  const totalPricePerUnit = pricingHistory.reduce(
    (sum, record) => sum + record.pricePerUnit,
    0
  );
  const averagePricePerUnit = totalPricePerUnit / pricingHistory.length;

  // Calculate average total price for the requested quantity
  const averageTotalPrice = averagePricePerUnit * quantity;

  return {
    averagePricePerUnit: Math.round(averagePricePerUnit * 100) / 100,
    averageTotalPrice: Math.round(averageTotalPrice * 100) / 100,
    sampleSize: pricingHistory.length,
    pricingHistory: pricingHistory.slice(0, 5), // Return top 5 for reference
  };
};

export const update = async (id, updateData) => {
  return await (VendorPricingHistory as any).findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await (VendorPricingHistory as any).findByIdAndDelete(id);
};
