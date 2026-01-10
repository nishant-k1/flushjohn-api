/**
 * Job Orders Repository - Database Access Layer
 */

import JobOrders from "../models/JobOrders.js";

export const create = async (jobOrderData) => {
  const result = await (JobOrders as any).create(jobOrderData);
  return result;
};

export const findAll = async ({
  query = {},
  sort = {},
  skip = 0,
  limit = 10,
}) => {
  return await (JobOrders as any)
    .find(query)
    .populate("lead")
    .populate("salesOrder")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

export const count = async (query = {}) => {
  return await (JobOrders as any).countDocuments(query);
};

export const findById = async (id, lean = true) => {
  let query = (JobOrders as any)
    .findById(id)
    .populate("lead")
    .populate("salesOrder");

  // ✅ PERFORMANCE: Use .lean() for read-only queries (20-30% faster, less memory)
  if (lean) {
    query = query.lean();
  }

  return await query;
};

export const findOne = async (query, projection = null) => {
  return await (JobOrders as any)
    .findOne(query, projection)
    .sort({ jobOrderNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await (JobOrders as any).findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await (JobOrders as any).findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await JobOrders.exists({ _id: id });
};
