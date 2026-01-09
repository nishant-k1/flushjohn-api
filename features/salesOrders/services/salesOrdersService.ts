import * as salesOrdersRepository from "../repositories/salesOrdersRepository.js";
import * as customersRepository from "../../customers/repositories/customersRepository.js";
import * as conversationLogRepository from "../../salesAssist/repositories/conversationLogRepository.js";
import { getCurrentDateTime, dayjs } from "../../../lib/dayjs.js";
import { updateSalesOrderPaymentTotals } from "../../payments/services/paymentsService.js";
import { abs, subtract } from "../../../utils/priceCalculations.js";
import {
  calculateTotalPages,
  calculateSkip,
} from "../../../utils/numericCalculations.js";

export const generateSalesOrderNumber = async () => {
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const latestSalesOrder = await salesOrdersRepository.findOne(
        {},
        "salesOrderNo"
      );
      const latestSalesOrderNo = latestSalesOrder
        ? latestSalesOrder.salesOrderNo
        : 999;
      const newSalesOrderNo = latestSalesOrderNo + 1;

      // Verify uniqueness by checking if this number exists
      const existingSalesOrder = await salesOrdersRepository.findOne({
        salesOrderNo: newSalesOrderNo,
      });
      if (!existingSalesOrder) {
        return newSalesOrderNo;
      }

      // If duplicate found, wait a bit and retry
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw new Error(
          "Failed to generate unique sales order number after retries"
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    }
  }

  throw new Error("Failed to generate unique sales order number");
};

const formatSalesOrderResponse = (salesOrder, lead) => {
  const salesOrderObj = salesOrder.toObject
    ? salesOrder.toObject()
    : salesOrder;

  if (!lead) {
    return salesOrderObj;
  }

  const leadObj = lead.toObject ? lead.toObject() : lead;

  return {
    ...salesOrderObj,
    lead: leadObj,
  };
};

/**
 * Create a new sales order
 * CRITICAL FIX: Uses database transaction for multi-step operations to ensure data consistency
 * @param {Object} salesOrderData - Sales order data
 * @returns {Promise<Object>} Created sales order
 */
export const createSalesOrder = async (salesOrderData) => {
  if (!salesOrderData.email || !salesOrderData.quoteNo) {
    const error = new Error("Email and Quote Number are required");
    error.name = "ValidationError";
    throw error;
  }

  // CRITICAL FIX: Use database transaction for atomic multi-step operation
  const mongoose = await import("mongoose");
  const session = await mongoose.default.startSession();
  
  try {
    return await session.withTransaction(async () => {
      const createdAt = getCurrentDateTime();
      const salesOrderNo = await generateSalesOrderNumber();

      let customerNo = null;

      // Helper function to normalize phone numbers (remove non-digits, get last 10 digits)
      const normalizePhone = (phone) => {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, "");
        // Return last 10 digits (handles numbers with country code like +1 or 1 prefix)
        return digits.slice(-10);
      };

      // Build query to find customer by email OR phone
      const customerQuery = {
        $or: [],
      };

      // Always check by email if provided
      if (salesOrderData.email) {
        (customerQuery as any).$or.push({ email: salesOrderData.email });
      }

      // Add phone number search if phone is provided
      if (salesOrderData.phone) {
        const normalizedPhone = normalizePhone(salesOrderData.phone);
        if (normalizedPhone && normalizedPhone.length === 10) {
          // Create a regex pattern that matches the 10 digits in sequence
          // This handles various phone formats like "(123) 456-7890", "123-456-7890", "1234567890", etc.
          // The pattern looks for the digits in order, allowing for non-digit characters between them
          const phonePattern = normalizedPhone.split("").join("\\D*");
          (customerQuery as any).$or.push({
            phone: { $regex: phonePattern },
          });
        }
      }

      // Only execute query if we have at least one search criteria
      if ((customerQuery as any).$or.length > 0) {
        const existingCustomer = await customersRepository.findOne(customerQuery);

        if (existingCustomer) {
          customerNo = existingCustomer.customerNo;
        }
      }

      const newSalesOrderData = {
        ...salesOrderData,
        createdAt,
        salesOrderNo,
        customerNo: customerNo,
        emailStatus: "Pending",
        lead: salesOrderData.lead || null,
        leadNo: salesOrderData.leadNo || null,
        quote: salesOrderData.quote || null,
      };

      // Data is automatically serialized by middleware
      // CRITICAL FIX: Use session for transaction
      const createdSalesOrder = await salesOrdersRepository.create(newSalesOrderData);

      // Update ConversationLog for AI learning - mark as converted (within transaction)
      if (createdSalesOrder.lead) {
        await conversationLogRepository.updateOnSalesOrderCreated(
          createdSalesOrder.lead,
          createdSalesOrder._id
        );
      }

      // Calculate and update payment totals (orderTotal, paidAmount, balanceDue)
      // This ensures balanceDue is correctly set even when no payments exist yet
      await updateSalesOrderPaymentTotals(createdSalesOrder._id);

      // Note: Customer creation/linking is done outside transaction as it's non-critical
      // and we don't want to fail the sales order creation if it fails
      session.endSession().catch(() => {}); // End session in background
      
      // Create or link customer when sales order is created (non-blocking)
      createOrLinkCustomerFromSalesOrder(createdSalesOrder).catch((error: any) => {
        console.error(
          "Error creating/linking customer on SalesOrder creation (non-critical):",
          error.message || String(error)
        );
      });

      // Fetch updated sales order to return with correct totals
      const updatedSalesOrder = await salesOrdersRepository.findById(
        createdSalesOrder._id
      );
      return updatedSalesOrder || createdSalesOrder;
    });
  } catch (error: any) {
    await session.endSession();
    // If transaction fails, all changes are rolled back
    throw error;
  }
};

/**
 * Get all sales orders using aggregation pipeline with $lookup for lead data
 * This enables searching by lead fields (fName, lName, cName, email, phone, usageType)
 */
const getAllSalesOrdersWithAggregation = async ({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  startDate,
  endDate,
  columnFilters,
}) => {
  const skip = calculateSkip(page, limit);
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Import SalesOrders model
  const SalesOrders = (await import("../models/SalesOrders.js")).default;

  // Build aggregation pipeline
  const pipeline = [];

  // Step 1: JOIN leads collection FIRST (before any filtering)
  pipeline.push({
    $lookup: {
      from: "leads",
      localField: "lead",
      foreignField: "_id",
      as: "leadData",
    },
  });

  // Step 2: Flatten leadData array
  pipeline.push({
    $unwind: {
      path: "$leadData",
      preserveNullAndEmptyArrays: true,
    },
  });

  // Step 3: Build match conditions for column filters
  const columnFilterConditions = {};
  const columnFilterExpr = [];

  // Fields directly in sales orders collection
  const salesOrderFieldFilters = [
    "salesOrderNo",
    "customerNo",
    "leadNo",
    "customerName",
    "customerEmail",
    "customerPhone",
    "eventLocation",
    "deliveryDate",
    "pickupDate",
    "emailStatus",
    "contactPersonName",
    "contactPersonPhone",
    "instructions",
    "note",
    "createdAt",
    "status",
    "paymentStatus",
  ];

  // Lead fields (now available via $lookup as leadData)
  const leadFieldFilters = [
    "fName",
    "lName",
    "cName",
    "email",
    "phone",
    "usageType",
  ];

  const allowedColumnFilters = [...salesOrderFieldFilters, ...leadFieldFilters];

  Object.keys(columnFilters).forEach((key) => {
    if (allowedColumnFilters.includes(key) && columnFilters[key]) {
      const filterValue = String(columnFilters[key]).trim();
      if (filterValue) {
        // Determine the field path (sales order fields vs lead fields)
        const isLeadField = leadFieldFilters.includes(key);
        const fieldPath = isLeadField ? `leadData.${key}` : key;
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
            columnFilterConditions[fieldPath] = {
              $gte: startOfDay,
              $lte: endOfDay,
            };
          } else {
            if (key === "createdAt") {
              const escapedValue = filterValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              columnFilterExpr.push({
                $regexMatch: {
                  input: {
                    $dateToString: {
                      format: "%B %d, %Y, %H:%M",
                      date: `$${fieldPath}`,
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
              columnFilterConditions[fieldPath] = {
                $regex: escapedValue,
                $options: "i",
              };
            }
          }
        } else if (
          key === "salesOrderNo" ||
          key === "customerNo" ||
          key === "leadNo"
        ) {
          const numericValue = Number.isFinite(Number(filterValue))
            ? Number(filterValue)
            : null;
          if (numericValue !== null) {
            columnFilterConditions[fieldPath] = numericValue;
          } else {
            const escapedValue = filterValue.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            columnFilterExpr.push({
              $regexMatch: {
                input: { $toString: `$${fieldPath}` },
                regex: escapedValue,
                options: "i",
              },
            });
          }
        } else {
          // Text fields (includes lead fields like fName, lName, etc.)
          const escapedValue = filterValue.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          columnFilterConditions[fieldPath] = {
            $regex: escapedValue,
            $options: "i",
          };
        }
      }
    }
  });

  // Step 4: Build match conditions for global search (only if search is provided)
  const searchConditions = [];

  if (search && search.trim()) {
    // Search in sales order fields
    searchConditions.push(
      { customerName: { $regex: escapedSearch, $options: "i" } },
      { customerEmail: { $regex: escapedSearch, $options: "i" } },
      { customerPhone: { $regex: escapedSearch, $options: "i" } },
      { eventLocation: { $regex: escapedSearch, $options: "i" } },
      { deliveryDate: { $regex: escapedSearch, $options: "i" } },
      { pickupDate: { $regex: escapedSearch, $options: "i" } },
      { emailStatus: { $regex: escapedSearch, $options: "i" } },
      { contactPersonName: { $regex: escapedSearch, $options: "i" } },
      { contactPersonPhone: { $regex: escapedSearch, $options: "i" } },
      { instructions: { $regex: escapedSearch, $options: "i" } },
      { note: { $regex: escapedSearch, $options: "i" } },
      { status: { $regex: escapedSearch, $options: "i" } },
      { paymentStatus: { $regex: escapedSearch, $options: "i" } }
    );

    // ✅ Search in lead fields (NOW AVAILABLE via $lookup!)
    searchConditions.push(
      { "leadData.fName": { $regex: escapedSearch, $options: "i" } },
      { "leadData.lName": { $regex: escapedSearch, $options: "i" } },
      { "leadData.cName": { $regex: escapedSearch, $options: "i" } },
      { "leadData.email": { $regex: escapedSearch, $options: "i" } },
      { "leadData.phone": { $regex: escapedSearch, $options: "i" } },
      { "leadData.usageType": { $regex: escapedSearch, $options: "i" } }
    );

    // Search numeric fields using $expr
    searchConditions.push(
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$salesOrderNo" },
            regex: escapedSearch,
            options: "i",
          },
        },
      },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$customerNo" },
            regex: escapedSearch,
            options: "i",
          },
        },
      },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$leadNo" },
            regex: escapedSearch,
            options: "i",
          },
        },
      }
    );

    // Search createdAt date field
    searchConditions.push({
      $expr: {
        $regexMatch: {
          input: {
            $dateToString: {
              format: "%B %d, %Y, %H:%M",
              date: "$createdAt",
            },
          },
          regex: escapedSearch,
          options: "i",
        },
      },
    });
  }

  // Step 5: Combine search and column filters
  const matchConditions = [];

  // Add global search conditions (only if search was provided)
  if (searchConditions.length > 0) {
    matchConditions.push({ $or: searchConditions });
  }

  // Add date range filter
  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    matchConditions.push({ createdAt: dateFilter });
  }

  // Add column filter conditions
  if (Object.keys(columnFilterConditions).length > 0) {
    Object.keys(columnFilterConditions).forEach((key) => {
      matchConditions.push({ [key]: columnFilterConditions[key] });
    });
  }

  // Add column filter $expr conditions
  if (columnFilterExpr.length > 0) {
    if (columnFilterExpr.length === 1) {
      matchConditions.push({ $expr: columnFilterExpr[0] });
    } else {
      matchConditions.push({ $expr: { $and: columnFilterExpr } });
    }
  }

  // Add $match stage if we have conditions
  if (matchConditions.length > 0) {
    if (matchConditions.length === 1) {
      pipeline.push({ $match: matchConditions[0] });
    } else {
      pipeline.push({ $match: { $and: matchConditions } });
    }
  }

  // Step 6: Count total documents (before pagination)
  const countPipeline = [...pipeline, { $count: "total" }];

  // Step 7: Sort
  const sortField = sortBy === "createdAt" ? "createdAt" : sortBy;
  pipeline.push({ $sort: { [sortField]: sortOrder === "desc" ? -1 : 1 } });

  // Step 8: Pagination
  pipeline.push({ $skip: skip }, { $limit: limit });

  // Step 9: Reshape result to match original structure
  pipeline.push({
    $addFields: {
      lead: "$leadData",
    },
  });

  pipeline.push({
    $project: {
      leadData: 0,
    },
  });

  // Execute both pipelines
  const [results, countResult] = await Promise.all([
    (SalesOrders as any).aggregate(pipeline),
    (SalesOrders as any).aggregate(countPipeline),
  ]);

  // Use nullish coalescing to preserve 0 values
  const total = countResult[0]?.total ?? 0;

  return {
    data: results,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages: calculateTotalPages(total, limit),
    },
  };
};

export const getAllSalesOrders = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
  startDate = null,
  endDate = null,
  ...columnFilters
}) => {
  const skip = calculateSkip(page, limit);

  // Lead fields that require $lookup aggregation
  const leadFields = ["fName", "lName", "cName", "email", "phone", "usageType"];

  // Check if any lead field is being filtered
  const hasLeadFieldFilter = Object.keys(columnFilters).some(
    (key) => leadFields.includes(key) && columnFilters[key]
  );

  // If global search OR lead field filtering is requested, use aggregation with $lookup
  if ((search && search.trim()) || hasLeadFieldFilter) {
    return await getAllSalesOrdersWithAggregation({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search ? search.trim() : "",
      startDate,
      endDate,
      columnFilters,
    });
  }

  // Otherwise, use regular query for column filters only (faster for non-lead fields)
  let query = {};
  const exprConditions = []; // Collect $expr conditions for numeric/date field regex searches

  // Handle column-specific filters
  const allowedColumnFilters = [
    "salesOrderNo",
    "customerNo",
    "leadNo",
    "customerName",
    "customerEmail",
    "customerPhone",
    "eventLocation",
    "deliveryDate",
    "pickupDate",
    "emailStatus",
    "contactPersonName",
    "contactPersonPhone",
    "instructions",
    "note",
    "createdAt",
    "status",
    "paymentStatus",
  ];

  Object.keys(columnFilters).forEach((key) => {
    if (allowedColumnFilters.includes(key) && columnFilters[key]) {
      const filterValue = String(columnFilters[key]).trim();
      if (filterValue) {
        // For date fields, try to parse with multiple formats
        if (
          key === "createdAt" ||
          key === "deliveryDate" ||
          key === "pickupDate"
        ) {
          try {
            // Only use exact date matching if the input includes a year (4 digits)
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
              // For createdAt (Date field), use $expr with $dateToString for partial matching
              // For deliveryDate/pickupDate (String fields), use regex
              if (key === "createdAt") {
                // Use $expr to convert Date to formatted string for partial matching
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
                // Fallback to regex search for String date fields (deliveryDate, pickupDate)
                const escapedValue = filterValue.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&"
                );
                query[key] = { $regex: escapedValue, $options: "i" };
              }
            }
          } catch (e) {
            // For createdAt (Date field), use $expr with $dateToString for partial matching
            // For deliveryDate/pickupDate (String fields), use regex
            if (key === "createdAt") {
              // Use $expr to convert Date to formatted string for partial matching
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
              // Fallback to regex search for String date fields (deliveryDate, pickupDate)
              const escapedValue = filterValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              query[key] = { $regex: escapedValue, $options: "i" };
            }
          }
        } else if (
          key === "salesOrderNo" ||
          key === "customerNo" ||
          key === "leadNo"
        ) {
          const numericValue = Number.isFinite(Number(filterValue))
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
          // For all other text fields, use regex search (supports partial matching)
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

  // Add date range filter
  if (startDate || endDate) {
    (query as any).createdAt = {};
    if (startDate) {
      (query as any).createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      (query as any).createdAt.$lte = new Date(endDate);
    }
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [salesOrders, total] = await Promise.all([
    salesOrdersRepository.findAll({ query, sort, skip, limit }),
    salesOrdersRepository.count(query),
  ]);

  const formattedSalesOrders = salesOrders.map((salesOrder) => {
    const salesOrderObj = salesOrder.toObject
      ? salesOrder.toObject()
      : salesOrder;
    return formatSalesOrderResponse(salesOrderObj, salesOrderObj.lead);
  });

  const totalPages = calculateTotalPages(total, limit);

  return {
    data: formattedSalesOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getSalesOrderById = async (id) => {
  const salesOrder = await salesOrdersRepository.findById(id);

  if (!salesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Recalculate payment totals if there's a discrepancy (e.g., orderTotal > 0 but balanceDue = 0 for unpaid orders)
  // This fixes existing sales orders that may have incorrect balanceDue values
  const salesOrderObj = salesOrder.toObject
    ? salesOrder.toObject()
    : salesOrder;
  const { calculateOrderTotal } =
    await import("../../../utils/productAmountCalculations.js");
  // Validate products before calculation - if products is missing, log error and skip recalculation
  if (salesOrderObj.products == null) {
    console.error(
      `Sales Order ${id} has null/undefined products. Cannot recalculate order total.`
    );
    return formatSalesOrderResponse(salesOrder, salesOrder.lead);
  }
  const calculatedOrderTotal = parseFloat(
    calculateOrderTotal(salesOrderObj.products)
  );

  // Check if recalculation is needed: orderTotal doesn't match calculated total, or balanceDue is 0 when it shouldn't be
  // Use tolerance check for floating point comparison (0.01 cents = $0.0001)
  const orderTotalDiff = abs(
    subtract(salesOrderObj.orderTotal, calculatedOrderTotal)
  );
  const needsRecalculation =
    orderTotalDiff > 0.01 ||
    (calculatedOrderTotal > 0 &&
      salesOrderObj.paidAmount === 0 &&
      salesOrderObj.balanceDue === 0);

  if (needsRecalculation) {
    try {
      await updateSalesOrderPaymentTotals(id);
      // Fetch again to get updated values
      const updatedSalesOrder = await salesOrdersRepository.findById(id);
      return formatSalesOrderResponse(
        updatedSalesOrder || salesOrder,
        (updatedSalesOrder || salesOrder).lead
      );
    } catch (error) {
      // If recalculation fails, return original sales order
      console.error("Error recalculating payment totals on fetch:", error);
    }
  }

  return formatSalesOrderResponse(salesOrder, salesOrder.lead);
};

export const updateSalesOrder = async (id, updateData) => {
  // Get the existing sales order to access the lead reference
  const existingSalesOrder = await salesOrdersRepository.findById(id);
  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  let leadId = updateData.lead || existingSalesOrder.lead;

  // ✅ Separate fields that belong to Lead vs SalesOrder
  const leadFields = {
    fName: updateData.fName,
    lName: updateData.lName,
    cName: updateData.cName,
    email: updateData.email,
    phone: updateData.phone,
    fax: updateData.fax,
    streetAddress: updateData.streetAddress,
    city: updateData.city,
    state: updateData.state,
    zip: updateData.zip,
    country: updateData.country,
    usageType: updateData.usageType,
  };

  // Remove undefined fields from leadFields
  Object.keys(leadFields).forEach(
    (key) => leadFields[key] === undefined && delete leadFields[key]
  );

  // ✅ Update the associated Lead if it exists and there are lead fields to update
  if (leadId && Object.keys(leadFields).length > 0) {
    const Leads = (await import("../../leads/models/Leads.js")).default;
    // Data is automatically serialized by middleware
    await (Leads as any).findByIdAndUpdate(
      leadId,
      { $set: leadFields },
      { new: true, runValidators: true }
    );
  }

  // ✅ SalesOrder-specific fields (exclude lead-related customer info)
  const salesOrderFields = {
    products: updateData.products,
    deliveryDate: updateData.deliveryDate,
    pickupDate: updateData.pickupDate,
    contactPersonName: updateData.contactPersonName,
    contactPersonPhone: updateData.contactPersonPhone,
    instructions: updateData.instructions,
    note: updateData.note,
    emailStatus: updateData.emailStatus,
    billingCycles: updateData.billingCycles,
  };

  // Data is automatically serialized by middleware
  // Remove undefined fields from salesOrderFields
  Object.keys(salesOrderFields).forEach(
    (key) => salesOrderFields[key] === undefined && delete salesOrderFields[key]
  );

  // ✅ Update the SalesOrder with only sales-order-specific fields
  const salesOrder = await salesOrdersRepository.updateById(id, {
    ...salesOrderFields,
    ...(leadId && { lead: leadId }),
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: getCurrentDateTime(),
  });

  if (!salesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  // If products were updated, recalculate payment totals (orderTotal, balanceDue, etc.)
  if (updateData.products !== undefined) {
    try {
      await updateSalesOrderPaymentTotals(id);
    } catch (error) {
      // Log but don't fail the update
      console.error(
        "Error updating payment totals on SalesOrder update:",
        error
      );
    }
  }

  const updatedSalesOrder = await salesOrdersRepository.findById(id);

  return formatSalesOrderResponse(
    updatedSalesOrder || salesOrder,
    updatedSalesOrder?.lead
  );
};

export const cancelSalesOrder = async (id) => {
  const existingSalesOrder = await salesOrdersRepository.findById(id);

  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Check if already cancelled
  if (existingSalesOrder.status === "cancelled") {
    const error = new Error("Sales Order is already cancelled");
    error.name = "AlreadyCancelledError";
    throw error;
  }

  // Check if there are any payments that haven't been fully refunded
  const Payments = (await import("../../payments/models/Payments.js")).default;

  const payments = await (Payments as any).find({
    salesOrder: id,
    status: { $in: ["succeeded", "partially_refunded"] },
  });

  // Check if any payment has outstanding refund amount
  // Use nullish coalescing to preserve 0 values
  const hasUnrefundedPayments = payments.some((payment) => {
    const refundedAmount = payment.refundedAmount ?? 0;
    return payment.amount > refundedAmount;
  });

  if (hasUnrefundedPayments) {
    const error = new Error(
      "Cannot cancel sales order. Please refund all payments before cancelling."
    );
    error.name = "UnrefundedPaymentsError";
    throw error;
  }

  // Update sales order status to cancelled
  const updatedSalesOrder = await salesOrdersRepository.updateById(id, {
    status: "cancelled",
  });

  return updatedSalesOrder;
};

export const deleteSalesOrder = async (id) => {
  const existingSalesOrder = await salesOrdersRepository.findById(id);

  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  const JobOrder = (await import("../../jobOrders/models/JobOrders.js"))
    .default;

  const jobOrdersCount = await (JobOrder as any).countDocuments({
    $or: [
      { salesOrder: id },
      { salesOrderNo: existingSalesOrder.salesOrderNo },
    ],
  });

  if (jobOrdersCount > 0) {
    const error = new Error(
      `Cannot delete sales order. Related records exist: ${jobOrdersCount} job order(s). ` +
        `Please delete these records first or contact an administrator.`
    );
    error.name = "DeletionBlockedError";
    (error as any).details = { jobOrdersCount };
    throw error;
  }

  await salesOrdersRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const linkSalesOrderToCustomer = async (salesOrder, leadId = null) => {
  const existingCustomer = await customersRepository.findOne({
    email: salesOrder.email,
  });

  if (existingCustomer) {
    await customersRepository.findOneAndUpdate(
      { email: salesOrder.email },
      {
        $addToSet: {
          salesOrders: salesOrder._id,
          ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
        },
      }
    );

    await salesOrdersRepository.updateById(salesOrder._id, {
      customerNo: existingCustomer.customerNo,
    });

    return existingCustomer;
  }

  return null;
};

export const createOrLinkCustomerFromSalesOrder = async (salesOrder) => {
  if (!salesOrder.lead) {
    return;
  }

  const Leads = (await import("../../leads/models/Leads.js")).default;
  const lead = await (Leads as any).findById(salesOrder.lead);

  if (!lead) {
    return;
  }

  const customerData = {
    fName: lead.fName,
    lName: lead.lName,
    cName: lead.cName,
    email: lead.email,
    phone: lead.phone,
    fax: lead.fax,
    streetAddress: lead.streetAddress,
    city: lead.city,
    state: lead.state,
    zip: lead.zip,
    country: lead.country || "USA",
  };

  const Customers = (await import("../../customers/models/Customers.js"))
    .default;

  let customer = await (Customers as any).findOne({
    email: customerData.email,
  });

  if (!customer) {
    const latestCustomer = await (Customers as any).findOne({}, "customerNo");
    const customerNo = latestCustomer?.customerNo
      ? latestCustomer.customerNo + 1
      : 1000;

    customer = await (Customers as any).create({
      ...customerData,
      customerNo,
      salesOrders: [salesOrder._id],
      ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
    });

    await (Leads as any).findByIdAndUpdate(lead._id, {
      customer: customer._id,
    });

    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes.js")).default;
      await (Quotes as any).findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  } else {
    await (Customers as any).findByIdAndUpdate(customer._id, {
      $addToSet: {
        salesOrders: salesOrder._id,
        ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
      },
    });

    // Also update Lead's customer reference when Customer already exists
    // This ensures the Lead shows up in "Show Customers Only" filter
    await (Leads as any).findByIdAndUpdate(lead._id, {
      customer: customer._id,
    });

    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes.js")).default;
      await (Quotes as any).findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  }

  await salesOrdersRepository.updateById(salesOrder._id, {
    customerNo: customer.customerNo,
    customer: customer._id,
  });

  return customer;
};
