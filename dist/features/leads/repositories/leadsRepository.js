/**
 * Leads Repository - Database Access Layer
 *
 * This layer handles all direct database operations for Leads.
 * No business logic should be here - just pure database queries.
 */
import Leads from "../models/Leads.js";
/**
 * Create a new lead
 */
export const create = async (leadData) => {
    return await Leads.create(leadData);
};
/**
 * Find all leads with filters, sorting, and pagination
 */
export const findAll = async ({ query = {}, sort = {}, skip = 0, limit = 10 }) => {
    return await Leads.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
};
/**
 * Count leads matching query
 */
export const count = async (query = {}) => {
    return await Leads.countDocuments(query);
};
/**
 * Find a lead by ID
 */
export const findById = async (id) => {
    return await Leads.findById(id);
};
/**
 * Find one lead matching query
 */
export const findOne = async (query, projection = null) => {
    return await Leads.findOne(query, projection).sort({ leadNo: -1 });
};
/**
 * Update a lead by ID
 */
export const updateById = async (id, updateData) => {
    return await Leads.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};
/**
 * Delete a lead by ID
 */
export const deleteById = async (id) => {
    return await Leads.findByIdAndDelete(id);
};
/**
 * Check if a lead exists by ID
 */
export const exists = async (id) => {
    return await Leads.exists({ _id: id });
};
//# sourceMappingURL=leadsRepository.js.map