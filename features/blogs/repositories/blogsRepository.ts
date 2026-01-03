/**
 * Blogs Repository - Database Access Layer
 */

import Blogs from "../models/Blogs.js";

export const create = async (blogData) => {
  return await Blogs.create(blogData);
};

export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
  return await Blogs.find(query).sort(sort).skip(skip).limit(limit).lean();
};

export const count = async (query = {}) => {
  return await Blogs.countDocuments(query);
};

export const findById = async (id) => {
  return await Blogs.findById(id);
};

export const findOne = async (query, projection = null, options = {}) => {
  return await Blogs.findOne(query, projection, options);
};

export const updateById = async (id, updateData) => {
  return await Blogs.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteById = async (id) => {
  return await Blogs.findByIdAndDelete(id);
};

export const exists = async (id) => {
  return await Blogs.exists({ _id: id });
};
