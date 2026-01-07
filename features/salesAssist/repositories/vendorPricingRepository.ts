/**
 * Vendor Pricing History Repository - Database Access Layer
 */

import VendorPricingHistory from "../models/VendorPricingHistory.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";
import {
  roundPrice,
  floor,
  ceil,
  multiply,
} from "../../../utils/priceCalculations.js";
import { calculateAverage } from "../../../utils/numericCalculations.js";

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
    (query as any).zipCode = zipCode;
  } else if (city && state) {
    (query as any).city = { $regex: city, $options: "i" };
    (query as any).state = { $regex: state, $options: "i" };
  }

  if (eventType) {
    (query as any).eventType = eventType;
  }

  // Find pricing within similar quantity range (±50% to account for variations)
  if (quantity) {
    (query as any).quantity = {
      $gte: floor(multiply(quantity, 0.5)),
      $lte: ceil(multiply(quantity, 1.5)),
    };
  }

  return await (VendorPricingHistory as any)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const findByVendorId = async (vendorId, limit = 10) => {
  return await (VendorPricingHistory as any)
    .find({ vendorId })
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
  const query: any = {};

  if (zipCode) {
    query.zipCode = zipCode;
  } else if (city && state) {
    query.city = { $regex: city, $options: "i" };
    query.state = { $regex: state, $options: "i" };
  }

  if (eventType) {
    (query as any).eventType = eventType;
  }

  // Find pricing within similar quantity range
  if (quantity) {
    query.quantity = {
      $gte: floor(multiply(quantity, 0.5)),
      $lte: ceil(multiply(quantity, 1.5)),
    };
  }

  // Get recent pricing (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  query.createdAt = { $gte: ninetyDaysAgo };

  const pricingHistory = await (VendorPricingHistory as any)
    .find(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!pricingHistory || pricingHistory.length === 0) {
    return null;
  }

  // Calculate average price per unit using utility function
  const pricePerUnitValues = pricingHistory.map(
    (record) => record.pricePerUnit
  );
  const averagePricePerUnit = calculateAverage(pricePerUnitValues);

  // Calculate average total price for the requested quantity using utility function
  const averageTotalPrice = parseFloat(
    calculateProductAmount(quantity, averagePricePerUnit)
  );

  return {
    averagePricePerUnit: roundPrice(averagePricePerUnit),
    averageTotalPrice: averageTotalPrice,
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
