/**
 * Vendors Repository - Database Access Layer
 */

import Vendors from "../models/Vendors.js";

export const create = async (vendorData) => {
  return await (Vendors as any).create(vendorData);
};

export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
  return await (Vendors as any).find(query).sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (query = {}) => {
  return await (Vendors as any).countDocuments(query);
};

export const findById = async (id) => {
  return await (Vendors as any).findById(id);
};

export const findOne = async (query, projection = null) => {
  return await (Vendors as any).findOne(query, projection).sort({ vendorNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await (Vendors as any).findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await (Vendors as any).findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await (Vendors as any).exists({ _id: id });
};
