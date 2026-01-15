/**
 * Leads Service - Business Logic Layer
 *
 * This layer contains all business logic for Leads.
 * It orchestrates repositories and handles business rules.
 */

import * as leadsRepository from "../repositories/leadsRepository.js";
import {
  calculateTotalPages,
  calculateSkip,
} from "../../../utils/numericCalculations.js";
import alertService from "../../common/services/alertService.js";
import { getCurrentDateTime } from "../../../lib/dayjs.js";
import { createLeadNotification } from "../../notifications/services/notificationHelpers.js";
import { deleteNotificationsByLeadId } from "../../notifications/services/notificationsService.js";
import { calculateProductAmount } from "../../../utils/productAmountCalculations.js";

/**
 * Transform products based on lead source
 */
export const transformProductsData = (leadSource, products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  const normalizedProducts = products.map((product, index) => {
    // Always use quantity field (standardized)
    const quantity = Number(product.quantity) || 0;
    const rate = Number(product.rate) || 0;
    // Use utility function for consistent calculation
    const amount =
      Number(product.amount) ||
      parseFloat(calculateProductAmount(quantity, rate));

    return {
      id: product.id || `product-${Date.now()}-${index}`,
      item: String(product.item || product.type || ""),
      desc: String(product.desc || product.item || product.type || ""),
      quantity: quantity,
      rate: rate,
      amount: amount,
    };
  });

  if (leadSource === "Web Lead" || leadSource === "Web Quick Lead") {
    return normalizedProducts.filter((product) => product.quantity > 0);
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

  // Prepare initial data
  const preparedData = {
    ...restArgs,
    leadSource: actualLeadSource,
    usageType: processedUsageType,
    products: transformProductsData(actualLeadSource, products),
    streetAddress: street || streetAddress || "", // Map 'street' to 'streetAddress'
  };

  // Data is automatically serialized by middleware
  return preparedData;
};

/**
 * Generate next lead number atomically
 * CRITICAL FIX: Uses atomic increment to prevent race conditions
 * @returns {Promise<number>} Next lead number
 */
export const generateLeadNumber = async () => {
  try {
    // Use MongoDB's findOneAndUpdate with upsert for atomic increment
    const mongoose = await import("mongoose");
    const Counter: any =
      (mongoose.default.models as any).Counter ||
      mongoose.default.model(
        "Counter",
        new mongoose.default.Schema({
          _id: { type: String, required: true },
          seq: { type: Number, default: 0 },
        })
      );

    const result = await Counter.findOneAndUpdate(
      { _id: "leadNo" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    // If counter doesn't exist or is 0, initialize from latest lead
    if (!result || result.seq === 0) {
      const latestLead = await leadsRepository.findOne({}, "leadNo");
      const latestLeadNo = latestLead ? latestLead.leadNo : 999;
      const initialValue = latestLeadNo + 1;

      // Set the counter to the correct value
      await Counter.findOneAndUpdate(
        { _id: "leadNo" },
        { $set: { seq: initialValue } },
        { upsert: true }
      );

      return initialValue;
    }

    return result.seq;
  } catch (error: any) {
    // Fallback to non-atomic method if counter fails
    console.error(
      "❌ Error using atomic lead number generation, falling back:",
      error.message
    );
    const latestLead = await leadsRepository.findOne({}, "leadNo");
    const latestLeadNo = latestLead ? latestLead.leadNo : 999;
    return latestLeadNo + 1;
  }
};

/**
 * Send lead alerts (non-blocking)
 */
/**
 * Send lead alerts (non-blocking)
 * @param lead - Lead data
 * @param leadNo - Lead number
 */
export const sendLeadAlerts = async (lead, leadNo) => {
  try {
    const alertResults = await alertService.sendLeadAlerts(lead);
    return alertResults;
  } catch (alertError: any) {
    console.error("❌ Error sending lead alerts:", {
      leadId: lead?._id,
      leadNo,
      error: alertError.message || String(alertError),
      stack: alertError.stack,
    });
    // Don't throw - alerts are non-critical, lead creation should succeed
    return null;
  }
};

/**
 * Create a new lead
 */
export const createLead = async (leadData) => {
  // Usage type is optional for simplified forms (Web Quick Lead, Web Hero Quick Lead)
  // Only validate if usageType is provided (not undefined/null)
  // This allows simplified forms to submit without usageType
  if (leadData.usageType !== undefined && leadData.usageType !== null) {
    const usageTypeStr = String(leadData.usageType).trim();
    if (usageTypeStr === "" || usageTypeStr === "None") {
      const error = new Error("Usage type cannot be empty or 'None' if provided");
    error.name = "ValidationError";
    throw error;
    }
  }
  const createdAt = getCurrentDateTime();
  const leadNo = await generateLeadNumber();
  const preparedData = prepareLeadData({ ...leadData, createdAt, leadNo });
  const lead = await leadsRepository.create(preparedData);

  // Send alerts in background (non-blocking)
  sendLeadAlerts(lead, leadNo).catch((alertError: any) => {
    console.error("❌ Error in sendLeadAlerts background task:", {
      leadId: lead._id,
      error: alertError.message || String(alertError),
    });
  });

  // Create notifications and get saved data - MUST await before emitting socket events
  const savedNotifications = await createLeadNotification(lead);

  return { lead, notifications: savedNotifications };
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
  hasCustomerNo,
  ...columnFilters
}) => {
  let query = {};
  const exprConditions = [];
  const dayjs = (await import("../../../lib/dayjs.js")).dayjs;

  // Legacy filters
  if (status) (query as any).leadStatus = status;
  if (assignedTo) (query as any).assignedTo = assignedTo;
  if (leadSource) (query as any).leadSource = leadSource;

  // Filter for leads that have been converted to customers
  // When hasCustomerNo is true, filter leads that have a customer reference
  if (hasCustomerNo === true || hasCustomerNo === "true") {
    (query as any).customer = { $exists: true, $ne: null };
  }

  // Handle column-specific filters (all fields are in the leads collection)
  const allowedColumnFilters = [
    "leadNo",
    "fName",
    "lName",
    "cName",
    "email",
    "phone",
    "fax",
    "contactPersonName",
    "contactPersonPhone",
    "streetAddress",
    "city",
    "state",
    "zip",
    "country",
    "deliveryDate",
    "pickupDate",
    "usageType",
    "leadStatus",
    "leadSource",
    "assignedTo",
    "instructions",
    "createdAt",
  ];

  Object.keys(columnFilters).forEach((key) => {
    if (allowedColumnFilters.includes(key) && columnFilters[key]) {
      const filterValue = String(columnFilters[key]).trim();
      if (filterValue) {
        // For date fields
        if (
          key === "createdAt" ||
          key === "deliveryDate" ||
          key === "pickupDate"
        ) {
          const hasYear = /\d{4}/.test(filterValue);
          let parsedDate = null;

          if (hasYear) {
            const dateFormats = [
              "MMMM D, YYYY",
              "MMMM D YYYY",
              "MMM D, YYYY",
              "MMM D YYYY",
              "MM/DD/YYYY",
              "MM-DD-YYYY",
              "YYYY-MM-DD",
              "M/D/YYYY",
              "M-D-YYYY",
              "D MMMM YYYY",
              "D MMM YYYY",
            ];

            for (const format of dateFormats) {
              const testDate = dayjs(filterValue, format, true);
              if (testDate.isValid()) {
                parsedDate = testDate;
                break;
              }
            }

            if (!parsedDate || !parsedDate.isValid()) {
              const standardDate = new Date(filterValue);
              if (!isNaN(standardDate.getTime())) {
                parsedDate = dayjs(standardDate);
              }
            }
          }

          if (parsedDate && parsedDate.isValid() && hasYear) {
            const startOfDay = parsedDate.startOf("day").toDate();
            const endOfDay = parsedDate.endOf("day").toDate();
            query[key] = { $gte: startOfDay, $lte: endOfDay };
          } else {
            if (key === "createdAt") {
              const escapedValue = filterValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              exprConditions.push({
                $regexMatch: {
                  input: {
                    $dateToString: {
                      format: "%B %d, %Y, %H:%M",
                      date: `$${key}`,
                    },
                  },
                  regex: escapedValue,
                  options: "i",
                },
              });
            } else {
              const escapedValue = filterValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              query[key] = { $regex: escapedValue, $options: "i" };
            }
          }
        } else if (key === "leadNo") {
          const numericValue =
            Number.isFinite(Number(filterValue)) &&
            !isNaN(Number(filterValue)) &&
            String(Number(filterValue)) === filterValue.trim()
              ? Number(filterValue)
              : null;

          if (numericValue !== null) {
            query[key] = numericValue;
          } else {
            const escapedValue = filterValue.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            exprConditions.push({
              $regexMatch: {
                input: { $toString: `$${key}` },
                regex: escapedValue,
                options: "i",
              },
            });
          }
        } else {
          const escapedValue = filterValue.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          query[key] = { $regex: escapedValue, $options: "i" };
        }
      }
    }
  });

  // Combine $expr conditions if any exist
  if (exprConditions.length > 0) {
    if (exprConditions.length === 1) {
      (query as any).$expr = exprConditions[0];
    } else {
      (query as any).$expr = { $and: exprConditions };
    }
  }

  // Handle global search
  if (search) {
    // CRITICAL FIX: Input sanitization - validate search string length and complexity
    const MAX_SEARCH_LENGTH = 200; // Prevent extremely long search strings
    if (typeof search !== "string" || search.length > MAX_SEARCH_LENGTH) {
      throw new Error(
        `Search string must be a string and less than ${MAX_SEARCH_LENGTH} characters`
      );
    }

    // Prevent potential DoS via complex regex patterns
    // Limit consecutive special characters that could cause regex issues
    const complexPatternRegex = /[.*+?^${}()|[\]\\]{10,}/;
    if (complexPatternRegex.test(search)) {
      throw new Error("Search string contains too many special characters");
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { fName: { $regex: escapedSearch, $options: "i" } },
      { lName: { $regex: escapedSearch, $options: "i" } },
      { cName: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { phone: { $regex: escapedSearch, $options: "i" } },
      { fax: { $regex: escapedSearch, $options: "i" } },
      { contactPersonName: { $regex: escapedSearch, $options: "i" } },
      { contactPersonPhone: { $regex: escapedSearch, $options: "i" } },
      { streetAddress: { $regex: escapedSearch, $options: "i" } },
      { city: { $regex: escapedSearch, $options: "i" } },
      { state: { $regex: escapedSearch, $options: "i" } },
      { zip: { $regex: escapedSearch, $options: "i" } },
      { country: { $regex: escapedSearch, $options: "i" } },
      { usageType: { $regex: escapedSearch, $options: "i" } },
      { leadStatus: { $regex: escapedSearch, $options: "i" } },
      { leadSource: { $regex: escapedSearch, $options: "i" } },
      { assignedTo: { $regex: escapedSearch, $options: "i" } },
      { instructions: { $regex: escapedSearch, $options: "i" } },
    ];

    // Search leadNo using $expr for partial numeric matching (handle null/missing values)
    searchConditions.push({
      $expr: {
        $regexMatch: {
          input: {
            $ifNull: [{ $toString: "$leadNo" }, ""],
          },
          regex: escapedSearch,
          options: "i",
        },
      },
    } as any);

    // Search createdAt date field with partial matching (handle null/missing dates and string dates)
    searchConditions.push({
      $expr: {
        $regexMatch: {
          input: {
            $ifNull: [
              {
                $dateToString: {
                  format: "%B %d, %Y, %H:%M",
                  date: {
                    $convert: {
                      input: "$createdAt",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                },
              },
              "",
            ],
          },
          regex: escapedSearch,
          options: "i",
        },
      },
    } as any);

    // Search deliveryDate date field with partial matching (handle null/missing dates and string dates)
    searchConditions.push({
      $expr: {
        $regexMatch: {
          input: {
            $ifNull: [
              {
                $dateToString: {
                  format: "%B %d, %Y",
                  date: {
                    $convert: {
                      input: "$deliveryDate",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                },
              },
              "",
            ],
          },
          regex: escapedSearch,
          options: "i",
        },
      },
    } as any);

    // Search pickupDate date field with partial matching (handle null/missing dates and string dates)
    searchConditions.push({
      $expr: {
        $regexMatch: {
          input: {
            $ifNull: [
              {
                $dateToString: {
                  format: "%B %d, %Y",
                  date: {
                    $convert: {
                      input: "$pickupDate",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                },
              },
              "",
            ],
          },
          regex: escapedSearch,
          options: "i",
        },
      },
    } as any);

    // Combine search with existing filters
    const hasOtherFilters = Object.keys(query).some(
      (key) => key !== "$or" && key !== "$and" && key !== "$expr"
    );
    const hasExpr = (query as any).$expr;

    if (hasOtherFilters || hasExpr) {
      const andConditions: any[] = [{ $or: searchConditions }];

      Object.keys(query).forEach((key) => {
        if (key !== "$or" && key !== "$and" && key !== "$expr") {
          andConditions.push({ [key]: query[key] } as any);
        }
      });

      if (hasExpr) {
        andConditions.push({ $expr: (query as any).$expr } as any);
      }

      query = { $and: andConditions } as any;
    } else {
      query = { $or: searchConditions } as any;
    }
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

  const skip = calculateSkip(page, limit);

  const [leadsList, totalCount] = await Promise.all([
    leadsRepository.findAll({ query, sort, skip, limit }),
    leadsRepository.count(query),
  ]);

  const totalPages = calculateTotalPages(totalCount, limit);
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

  // Data is automatically serialized by middleware
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

  // Check for related records
  const Quote = (await import("../../quotes/models/Quotes.js")).default;
  const SalesOrder = (await import("../../salesOrders/models/SalesOrders.js"))
    .default;
  const JobOrder = (await import("../../jobOrders/models/JobOrders.js"))
    .default;

  const [quotesCount, salesOrdersCount, jobOrdersCount] = await Promise.all([
    (Quote as any).countDocuments({
      $or: [{ lead: id }, { leadId: id }, { leadNo: existingLead.leadNo }],
    }),
    (SalesOrder as any).countDocuments({
      $or: [{ lead: id }, { leadId: id }, { leadNo: existingLead.leadNo }],
    }),
    (JobOrder as any).countDocuments({
      $or: [{ lead: id }, { leadId: id }, { leadNo: existingLead.leadNo }],
    }),
  ]);

  if (quotesCount > 0 || salesOrdersCount > 0 || jobOrdersCount > 0) {
    const relatedRecords = [];
    if (quotesCount > 0) relatedRecords.push(`${quotesCount} quote(s)`);
    if (salesOrdersCount > 0)
      relatedRecords.push(`${salesOrdersCount} sales order(s)`);
    if (jobOrdersCount > 0)
      relatedRecords.push(`${jobOrdersCount} job order(s)`);

    const error = new Error(
      `Cannot delete lead. Related records exist: ${relatedRecords.join(
        ", "
      )}. ` + `Please delete these records first or contact an administrator.`
    );
    error.name = "DeletionBlockedError";
    (error as any).details = { quotesCount, salesOrdersCount, jobOrdersCount };
    throw error;
  }

  await leadsRepository.deleteById(id);

  // Delete all notifications related to this lead (non-blocking)
  deleteNotificationsByLeadId(id).catch((error) => {
    console.error("Error deleting notifications for lead:", error);
  });

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
