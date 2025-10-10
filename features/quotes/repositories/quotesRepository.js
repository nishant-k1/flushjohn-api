/**
 * Quotes Repository - Database Access Layer
 */

import Quotes from "../models/Quotes/index.js";

export const create = async (quoteData) => {
  return await Quotes.create(quoteData);
};

export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
  return await Quotes.find(query).sort(sort).skip(skip).limit(limit);
};

export const count = async (query = {}) => {
  return await Quotes.countDocuments(query);
};

export const findById = async (id) => {
  return await Quotes.findById(id);
};

export const findOne = async (query, projection = null) => {
  return await Quotes.findOne(query, projection).sort({ quoteNo: -1 });
};

export const updateById = async (id, updateData) => {
  return await Quotes.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await Quotes.findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await Quotes.exists({ _id: id });
};
