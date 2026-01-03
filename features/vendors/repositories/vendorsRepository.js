/**
 * Vendors Repository - Database Access Layer
 */

import Vendors from "../models/Vendors.js";

export const create = async (vendorData) => {
  return await Vendors.create(vendorData);
};

export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
  return await Vendors.find(query).sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (query = {}) => {
  return await Vendors.countDocuments(query);
};

export const findById = async (id) => {
  return await Vendors.findById(id);
};

export const findOne = async (query, projection = null) => {
  return await Vendors.findOne(query, projection).sort({ vendorNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await Vendors.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await Vendors.findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await Vendors.exists({ _id: id });
};
