/**
 * Sales Orders Repository - Database Access Layer
 */

import SalesOrders from "../models/SalesOrders/index.js";

export const create = async (salesOrderData) => {
  return await SalesOrders.create(salesOrderData);
};

export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
  return await SalesOrders.find(query).populate("lead").populate("quote").sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (query = {}) => {
  return await SalesOrders.countDocuments(query);
};

export const findById = async (id) => {
  return await SalesOrders.findById(id).populate("lead").populate("quote");
};

export const findOne = async (query, projection = null) => {
  return await SalesOrders.findOne(query, projection).sort({ salesOrderNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await SalesOrders.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await SalesOrders.findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await SalesOrders.exists({ _id: id });
};
