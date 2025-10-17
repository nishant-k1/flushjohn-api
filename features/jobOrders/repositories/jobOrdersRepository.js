/**
 * Job Orders Repository - Database Access Layer
 */

import JobOrders from "../models/JobOrders/index.js";

export const create = async (jobOrderData) => {
  const result = await JobOrders.create(jobOrderData);
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
