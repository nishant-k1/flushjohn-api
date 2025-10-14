/**
 * Job Orders Repository - Database Access Layer
 */

import JobOrders from "../models/JobOrders/index.js";

export const create = async (jobOrderData) => {
  console.log("🔍 Job Order Repository - Creating with data:", JSON.stringify(jobOrderData, null, 2));
  console.log("🔍 Job Order Repository - Vendor data being saved:", jobOrderData.vendor);
  const result = await JobOrders.create(jobOrderData);
  console.log("🔍 Job Order Repository - Created job order:", JSON.stringify(result, null, 2));
  return result;
};

export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
  return await JobOrders.find(query).sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (query = {}) => {
  return await JobOrders.countDocuments(query);
};

export const findById = async (id) => {
  return await JobOrders.findById(id);
};

export const findOne = async (query, projection = null) => {
  return await JobOrders.findOne(query, projection).sort({ jobOrderNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await JobOrders.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await JobOrders.findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await JobOrders.exists({ _id: id });
};
