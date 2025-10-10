/**
 * Customers Repository - Database Access Layer
 */

import Customers from "../models/Customers/index.js";

export const create = async (customerData) => {
  return await Customers.create(customerData);
};

export const findAll = async ({
  query = {},
  sort = {},
  skip = 0,
  limit = 10,
}) => {
  return await Customers.find(query).sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (query = {}) => {
  return await Customers.countDocuments(query);
};

export const findById = async (id) => {
  return await Customers.findById(id);
};

export const findOne = async (query, projection = null) => {
  return await Customers.findOne(query, projection).sort({ customerNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await Customers.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const findOneAndUpdate = async (query, updateData) => {
  return await Customers.findOneAndUpdate(query, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await Customers.findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await Customers.exists({ _id: id });
};
