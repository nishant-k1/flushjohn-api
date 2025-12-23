/**
 * Quotes Repository - Database Access Layer
 */

import Quotes from "../models/Quotes/index.js";

export const create = async (quoteData) => {
  return await Quotes.create(quoteData);
};

export const findAll = async ({
  query = {},
  sort = {},
  skip = 0,
  limit = 10,
  select = null,
}) => {
  let queryBuilder = Quotes.find(query)
    .populate("lead")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // ✅ PERFORMANCE: Use .lean() for read-only queries (20-30% faster, less memory)
  queryBuilder = queryBuilder.lean();

  // ✅ PERFORMANCE: Use .select() to limit fields returned (30-50% less data)
  if (select) {
    queryBuilder = queryBuilder.select(select);
  }

  return await queryBuilder;
};

export const count = async (query = {}) => {
  return await Quotes.countDocuments(query);
};

export const findById = async (id, lean = false) => {
  let query = Quotes.findById(id).populate("lead");
  // ✅ PERFORMANCE: Use .lean() for read-only queries
  if (lean) {
    query = query.lean();
  }
  return await query;
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
