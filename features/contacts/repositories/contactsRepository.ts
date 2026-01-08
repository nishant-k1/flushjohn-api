/**
 * Contacts Repository - Database Access Layer
 *
 * This layer handles all direct database operations for Contacts.
 * No business logic should be here - just pure database queries.
 */

import Contacts from "../models/Contacts.js";

/**
 * Create a new contact
 */
export const create = async (contactData) => {
  return await (Contacts as any).create(contactData);
};

/**
 * Find all contacts with filters, sorting, and pagination
 */
export const findAll = async ({
  query = {},
  sort = {},
  skip = 0,
  limit = 10,
}) => {
  return await (Contacts as any)
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

/**
 * Count contacts matching query
 */
export const count = async (query = {}) => {
  return await (Contacts as any).countDocuments(query);
};

/**
 * Find a contact by ID
 */
export const findById = async (id) => {
  return await (Contacts as any).findById(id);
};

/**
 * Find one contact matching query
 */
export const findOne = async (query, projection = null) => {
  return await (Contacts as any)
    .findOne(query, projection)
    .sort({ createdAt: -1 });
};

/**
 * Update a contact by ID
 */
export const updateById = async (id, updateData) => {
  return await (Contacts as any).findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete a contact by ID
 */
export const deleteById = async (id) => {
  return await (Contacts as any).findByIdAndDelete(id);
};

/**
 * Check if a contact exists by ID
 */
export const exists = async (id) => {
  return await Contacts.exists({ _id: id });
};
