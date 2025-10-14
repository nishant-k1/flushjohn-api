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
  // Normalize all product data to consistent CRM format - all strings for forms
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    // Handle old web form format: {type, quantity}
    if (product.type && product.quantity !== undefined) {
      const qty = Number(product.quantity) || 1;
      const rate = Number(product.rate) || 0;
      const amount = rate * qty;

      return {
        id: product.id || `legacy-${Date.now()}-${index}`,
        item: String(product.type || ""),
        desc: String(product.type || ""),
        qty: qty.toString(), // Convert to string for form consistency
        rate: rate.toFixed(2), // Convert to string with 2 decimals
        amount: amount.toFixed(2), // Convert to string with 2 decimals
      };
    }
    // Handle new CRM format: {item, qty, rate, amount} - ensure all strings
    else {
      const qty = product.qty || "1";
      const rate = product.rate || "0.00";
      const amount = product.amount || "0.00";

      return {
        id: product.id || `product-${Date.now()}-${index}`,
        item: String(product.item || ""),
        desc: String(product.desc || product.item || ""),
        qty: String(qty), // Ensure string
        rate: String(rate), // Ensure string
        amount: String(amount), // Ensure string
      };
    }
  });

  // Filter out products with no quantity for multi-step quote form
  if (leadSource === "Web Lead") {
    return normalizedProducts.filter((product) => {
      const qty = parseInt(product.qty || "0", 10) || 0;
      return qty > 0;
    });
  }

  return normalizedProducts;
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
