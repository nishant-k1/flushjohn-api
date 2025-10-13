/**
 * Leads Service - Business Logic Layer
 *
 * This layer contains all business logic for Leads.
 * It orchestrates repositories and handles business rules.
 */

import * as leadsRepository from "../repositories/leadsRepository.js";
import alertService from "../../../services/alertService.js";

/**
 * Transform products based on lead source
 */
export const transformProductsData = (leadSource, products) => {
  // Since all forms now use consistent CRM format, just return products as-is
  // Only filter out products with quantity 0 for web leads
  if (!Array.isArray(products)) {
    return [];
  }

  if (leadSource === "Web Lead") {
    // Filter out products with no quantity for multi-step quote form
    return products.filter((product) => {
      const qty = parseInt(product.qty) || 0;
      return qty > 0;
    });
  }

  // For all other lead sources, return products as-is (they're already in CRM format)
  return products;
};

/**
 * Prepare lead data for creation
 */
export const prepareLeadData = ({
  leadSource,
  products,
  street,
  ...restArgs
}) => {
  return {
    leadSource,
    products: transformProductsData(leadSource, products),
    streetAddress: street || restArgs.streetAddress || "", // Map 'street' to 'streetAddress'
    ...restArgs,
  };
};

/**
 * Generate next lead number
 */
export const generateLeadNumber = async () => {
  const latestLead = await leadsRepository.findOne({}, "leadNo");
  const latestLeadNo = latestLead ? latestLead.leadNo : 999;
  return latestLeadNo + 1;
};

/**
 * Send lead alerts (non-blocking)
 */
export const sendLeadAlerts = async (lead, leadNo) => {
  try {
    const alertResults = await alertService.sendLeadAlerts(lead);
    console.log(`📢 Alert results for lead #${leadNo}:`, alertResults);
  } catch (alertError) {
    console.error(`⚠️ Alert sending failed for lead #${leadNo}:`, alertError);
  }
};

/**
 * Create a new lead
 */
export const createLead = async (leadData) => {
  const createdAt = new Date();
  const leadNo = await generateLeadNumber();
  const preparedData = prepareLeadData({ ...leadData, createdAt, leadNo });
  const lead = await leadsRepository.create(preparedData);

  // Send alerts asynchronously (don't block on failure)
  sendLeadAlerts(lead, leadNo);

  return lead;
};

/**
 * Get all leads with filters and pagination
 */
export const getAllLeads = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  status,
  assignedTo,
  leadSource,
  search,
}) => {
  // Build query filters
  const query = {};

  if (status) query.leadStatus = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (leadSource) query.leadSource = leadSource;

  if (search) {
    query.$or = [
      { fName: { $regex: search, $options: "i" } },
      { lName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object
  const validSortFields = [
    "createdAt",
    "leadNo",
    "leadStatus",
    "assignedTo",
    "leadSource",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute queries
  const [leadsList, totalCount] = await Promise.all([
    leadsRepository.findAll({ query, sort, skip, limit }),
    leadsRepository.count(query),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data: leadsList,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
    filters: {
      sortBy: sortField,
      sortOrder,
      status,
      assignedTo,
      leadSource,
      search,
    },
  };
};

/**
 * Get a single lead by ID
 */
export const getLeadById = async (id) => {
  const lead = await leadsRepository.findById(id);

  if (!lead) {
    const error = new Error("Lead not found");
    error.name = "NotFoundError";
    throw error;
  }

  return lead;
};

/**
 * Update a lead by ID
 */
export const updateLead = async (id, updateData) => {
  const lead = await leadsRepository.updateById(id, {
    ...updateData,
    updatedAt: new Date(),
  });

  if (!lead) {
    const error = new Error("Lead not found");
    error.name = "NotFoundError";
    throw error;
  }

  return lead;
};

/**
 * Delete a lead by ID
 */
export const deleteLead = async (id) => {
  const existingLead = await leadsRepository.findById(id);

  if (!existingLead) {
    const error = new Error("Lead not found");
    error.name = "NotFoundError";
    throw error;
  }

  await leadsRepository.deleteById(id);
  return { _id: id };
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (page, limit) => {
  const errors = [];

  if (page < 1) {
    errors.push("Page number must be greater than 0");
  }

  if (limit < 1 || limit > 100) {
    errors.push("Limit must be between 1 and 100");
  }

  return errors;
};
