/**
 * Blogs Repository - Database Access Layer
 */

import Blogs from "../models/Blogs.js";

export const create = async (blogData) => {
  return await (Blogs as any).create(blogData);
};

export const findAll = async ({
  query = {},
  sort = {},
  skip = 0,
  limit = 10,
}) => {
  return await (Blogs as any)
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

export const count = async (query = {}) => {
  return await (Blogs as any).countDocuments(query);
};

export const findById = async (id) => {
  return await (Blogs as any).findById(id);
};

export const findOne = async (query, projection = null, options = {}) => {
  return await (Blogs as any).findOne(query, projection, options);
};

export const updateById = async (id, updateData) => {
  return await (Blogs as any).findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await (Blogs as any).findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await Blogs.exists({ _id: id });
};
