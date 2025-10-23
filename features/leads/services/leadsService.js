/**
 * Leads Service - Business Logic Layer
 *
 * This layer contains all business logic for Leads.
 * It orchestrates repositories and handles business rules.
 */

import * as leadsRepository from "../repositories/leadsRepository.js";
import alertService from "../../common/services/alertService.js";
import { getCurrentDateTime, createDate } from "../../../lib/dayjs/index.js";

/**
 * Transform products based on lead source
 */
export const transformProductsData = (leadSource, products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    if (product.type && product.quantity !== undefined) {
      const qty = Number(product.quantity);
      const rate = Number(product.rate) || 0;
      const amount = Number(product.amount) || rate * qty;

      return {
        id: product.id || `legacy-${Date.now()}-${index}`,
        item: String(product.type || ""),
        desc: String(product.desc || product.type || ""),
        qty: qty,
        rate: rate,
        amount: amount,
      };
    }
    else {
      const qty = Number(product.qty);
      const rate = Number(product.rate) || 0;
      const amount = Number(product.amount) || rate * qty;

      return {
        id: product.id || `product-${Date.now()}-${index}`,
        item: String(product.item || ""),
        desc: String(product.desc || product.item || ""),
        qty: qty,
        rate: rate,
        amount: amount,
      };
    }
  });

  if (leadSource === "Web Lead" || leadSource === "Web Quick Lead") {
    return normalizedProducts.filter((product) => product.qty > 0);
  }

  return normalizedProducts;
};

/**
 * Prepare lead data for creation
 */
export const prepareLeadData = (leadData) => {
  const {
    leadSource,
    products,
    street,
    streetAddress,
    usageType,
    ...restArgs
  } = leadData;

  const actualLeadSource = leadSource || "Web Lead";

  let processedUsageType = usageType || "";
  if (usageType) {
    processedUsageType =
      usageType.charAt(0).toUpperCase() + usageType.slice(1).toLowerCase();
  }

  return {
    ...restArgs,
    leadSource: actualLeadSource,
    usageType: processedUsageType,
    products: transformProductsData(actualLeadSource, products),
    streetAddress: street || streetAddress || "", // Map 'street' to 'streetAddress'
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
  } catch (alertError) {}
};

/**
 * Create a new lead
 */
export const createLead = async (leadData) => {
  if (
    !leadData.usageType ||
    leadData.usageType.trim() === "" ||
    leadData.usageType === "None"
  ) {
    const error = new Error("Usage type is required");
    error.name = "ValidationError";
    throw error;
  }
  const createdAt = getCurrentDateTime();
  const leadNo = await generateLeadNumber();
  const preparedData = prepareLeadData({ ...leadData, createdAt, leadNo });
  const lead = await leadsRepository.create(preparedData);
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

  const skip = (page - 1) * limit;

  const [leadsList, totalCount] = await Promise.all([
    leadsRepository.findAll({ query, sort, skip, limit }),
    leadsRepository.count(query),
  ]);

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
  if (
    updateData.usageType !== undefined &&
    (!updateData.usageType ||
      updateData.usageType.trim() === "" ||
      updateData.usageType === "None")
  ) {
    const error = new Error("Usage type is required");
    error.name = "ValidationError";
    throw error;
  }

  const lead = await leadsRepository.updateById(id, {
    ...updateData,
    updatedAt: getCurrentDateTime(),
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
