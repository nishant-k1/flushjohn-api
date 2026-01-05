import * as jobOrdersRepository from "../repositories/jobOrdersRepository.js";
import * as conversationLogRepository from "../../salesAssist/repositories/conversationLogRepository.js";
import { getCurrentDateTime, createDate } from "../../../lib/dayjs.js";

export const generateJobOrderNumber = async () => {
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const latestJobOrder = await jobOrdersRepository.findOne(
        {},
        "jobOrderNo"
      );
      const latestJobOrderNo = latestJobOrder ? latestJobOrder.jobOrderNo : 999;
      const newJobOrderNo = latestJobOrderNo + 1;

      // Verify uniqueness by checking if this number exists
      const existingJobOrder = await jobOrdersRepository.findOne({
        jobOrderNo: newJobOrderNo,
      });
      if (!existingJobOrder) {
        return newJobOrderNo;
      }

      // If duplicate found, wait a bit and retry
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw new Error(
          "Failed to generate unique job order number after retries"
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    }
  }

  throw new Error("Failed to generate unique job order number");
};

const formatJobOrderResponse = (jobOrder, lead) => {
  const jobOrderObj = jobOrder.toObject ? jobOrder.toObject() : jobOrder;

  if (!lead) {
    return jobOrderObj;
  }

  const leadObj = lead.toObject ? lead.toObject() : lead;

  return {
    ...jobOrderObj,
    lead: leadObj,
  };
};

export const createJobOrder = async (jobOrderData) => {
  if (!jobOrderData.salesOrderNo) {
    const error = new Error("Sales Order Number is required");
    error.name = "ValidationError";
    throw error;
  }

  if (
    !jobOrderData.contactPersonName ||
    jobOrderData.contactPersonName.trim() === ""
  ) {
    const error = new Error("Contact Person Name is required");
    error.name = "ValidationError";
    throw error;
  }

  if (
    !jobOrderData.contactPersonPhone ||
    jobOrderData.contactPersonPhone.trim() === ""
  ) {
    const error = new Error("Contact Person Phone is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.fName) {
    const error = new Error("First name is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.email) {
    const error = new Error("Email is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.phone) {
    const error = new Error("Phone number is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.streetAddress) {
    const error = new Error("Street address is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.city) {
    const error = new Error("City is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.state) {
    const error = new Error("State is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.zip) {
    const error = new Error("Zip code is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.deliveryDate) {
    const error = new Error("Delivery date is required");
    error.name = "ValidationError";
    throw error;
  }

  if (!jobOrderData.pickupDate) {
    const error = new Error("Pickup date is required");
    error.name = "ValidationError";
    throw error;
  }
  if (
    !jobOrderData.usageType ||
    jobOrderData.usageType.trim() === "" ||
    jobOrderData.usageType === "None"
  ) {
    const error = new Error("Usage type is required");
    error.name = "ValidationError";
    throw error;
  }

  const existingJobOrder = await jobOrdersRepository.findOne({
    salesOrderNo: jobOrderData.salesOrderNo,
  });

  if (existingJobOrder) {
    const error = new Error("A job order already exists for this sales order");
    error.name = "DuplicateError";
    error.existingJobOrderId = existingJobOrder._id;
    error.jobOrderNo = existingJobOrder.jobOrderNo;
    throw error;
  }

  const createdAt = getCurrentDateTime();
  const jobOrderNo = await generateJobOrderNumber();

  const newJobOrderData = {
    ...jobOrderData,
    createdAt,
    jobOrderNo,
    emailStatus: "Pending",
    lead: jobOrderData.lead || null,
    leadNo: jobOrderData.leadNo || null,
    salesOrder: jobOrderData.salesOrder || null,
  };

  const createdJobOrder = await jobOrdersRepository.create(newJobOrderData);

  // Update ConversationLog for AI learning - mark as conversion success!
  // This is the gold standard - when a JobOrder is created, the sale is confirmed
  if (createdJobOrder.lead) {
    try {
      await conversationLogRepository.updateOnJobOrderCreated(
        createdJobOrder.lead,
        createdJobOrder._id
      );
    } catch (error) {
      // Log but don't fail the job order creation
      console.error(
        "Error updating ConversationLog on JobOrder creation:",
        error
      );
    }
  }

  return createdJobOrder;
};

/**
 * Get all job orders using aggregation pipeline with $lookup for lead data
 * This enables searching by lead fields (fName, lName, cName, email, phone, usageType)
 */
const getAllJobOrdersWithAggregation = async ({
  page,
  limit,
  sortBy,
  sortOrder,
  search,
  startDate,
  endDate,
}) => {
  const skip = (page - 1) * limit;
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Import JobOrders model
  const JobOrders = (await import("../models/JobOrders.js")).default;

  // Build aggregation pipeline
  const pipeline = [];

  // Step 1: JOIN leads collection FIRST
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

  // Step 3: Build match conditions for global search
  const searchConditions = [];

  // Search in job order fields
  searchConditions.push(
    { jobLocation: { $regex: escapedSearch, $options: "i" } },
    { deliveryDate: { $regex: escapedSearch, $options: "i" } },
    { pickupDate: { $regex: escapedSearch, $options: "i" } },
    { emailStatus: { $regex: escapedSearch, $options: "i" } },
    { vendorAcceptanceStatus: { $regex: escapedSearch, $options: "i" } },
    { contactPersonName: { $regex: escapedSearch, $options: "i" } },
    { contactPersonPhone: { $regex: escapedSearch, $options: "i" } },
    { instructions: { $regex: escapedSearch, $options: "i" } },
    { note: { $regex: escapedSearch, $options: "i" } },
    { status: { $regex: escapedSearch, $options: "i" } },
    { "vendor.name": { $regex: escapedSearch, $options: "i" } }
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
          input: { $toString: "$jobOrderNo" },
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
          input: { $toString: "$salesOrderNo" },
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

  // Step 4: Combine search and date filters
  const matchConditions = [];

  // Add global search conditions
  if (searchConditions.length > 0) {
    matchConditions.push({ $or: searchConditions });
  }

  // Add date range filter
  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    matchConditions.push({ createdAt: dateFilter });
  }

  // Add $match stage if we have conditions
  if (matchConditions.length > 0) {
    if (matchConditions.length === 1) {
      pipeline.push({ $match: matchConditions[0] });
    } else {
      pipeline.push({ $match: { $and: matchConditions } });
    }
  }

  // Step 5: Count total documents (before pagination)
  const countPipeline = [...pipeline, { $count: "total" }];

  // Step 6: Sort
  const sortField = sortBy === "createdAt" ? "createdAt" : sortBy;
  pipeline.push({ $sort: { [sortField]: sortOrder === "desc" ? -1 : 1 } });

  // Step 7: Pagination
  pipeline.push({ $skip: skip }, { $limit: limit });

  // Step 8: Reshape result to match original structure
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
    (JobOrders as any).aggregate(pipeline),
    (JobOrders as any).aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: results,
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

export const getAllJobOrders = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
  startDate = null,
  endDate = null,
  ...columnFilters
}) => {
  const skip = (page - 1) * limit;

  // Lead fields that require $lookup aggregation
  const leadFields = ["fName", "lName", "cName", "email", "phone", "usageType"];
  
  // Check if any lead field is being filtered
  const hasLeadFieldFilter = Object.keys(columnFilters).some(key => 
    leadFields.includes(key) && columnFilters[key]
  );

  // If global search OR lead field filtering is requested, use aggregation with $lookup
  if ((search && search.trim()) || hasLeadFieldFilter) {
    return await getAllJobOrdersWithAggregation({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search ? search.trim() : "",
      startDate,
      endDate,
    });
  }

  // Otherwise, use regular query (faster for non-lead fields)
  let query = {};
  
  // Add date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [jobOrders, total] = await Promise.all([
    jobOrdersRepository.findAll({ query, sort, skip, limit }),
    jobOrdersRepository.count(query),
  ]);

  const formattedJobOrders = jobOrders.map((jobOrder) => {
    const jobOrderObj = jobOrder.toObject ? jobOrder.toObject() : jobOrder;
    return formatJobOrderResponse(jobOrderObj, jobOrderObj.lead);
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: formattedJobOrders,
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

export const getJobOrderById = async (id) => {
  const jobOrder = await jobOrdersRepository.findById(id);

  if (!jobOrder) {
    const error = new Error("Job Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  return formatJobOrderResponse(jobOrder, jobOrder.lead);
};

export const updateJobOrder = async (id, updateData) => {
  // Get the existing job order to access the lead reference
  const existingJobOrder = await jobOrdersRepository.findById(id);
  if (!existingJobOrder) {
    const error = new Error("Job Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  let leadId = updateData.lead || existingJobOrder.lead;

  // ✅ Separate fields that belong to Lead vs JobOrder
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
    await (Leads as any).findByIdAndUpdate(
      leadId,
      { $set: leadFields },
      { new: true, runValidators: true }
    );
  }

  // ✅ JobOrder-specific fields (exclude lead-related customer info)
  const jobOrderFields = {
    products: updateData.products,
    deliveryDate: updateData.deliveryDate,
    pickupDate: updateData.pickupDate,
    contactPersonName: updateData.contactPersonName,
    contactPersonPhone: updateData.contactPersonPhone,
    instructions: updateData.instructions,
    note: updateData.note,
    emailStatus: updateData.emailStatus,
    billingCycles: updateData.billingCycles,
    vendor: updateData.vendor,
    vendorAcceptanceStatus: updateData.vendorAcceptanceStatus,
    vendorHistory: updateData.vendorHistory,
  };

  // Remove undefined fields from jobOrderFields
  Object.keys(jobOrderFields).forEach(
    (key) => jobOrderFields[key] === undefined && delete jobOrderFields[key]
  );

  // ✅ Update the JobOrder with only job-order-specific fields
  const jobOrder = await jobOrdersRepository.updateById(id, {
    ...jobOrderFields,
    ...(leadId && { lead: leadId }),
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: getCurrentDateTime(),
  });

  if (!jobOrder) {
    const error = new Error("Job Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  const updatedJobOrder = await jobOrdersRepository.findById(id);

  return formatJobOrderResponse(
    updatedJobOrder || jobOrder,
    updatedJobOrder?.lead
  );
};

export const deleteJobOrder = async (id) => {
  const existingJobOrder = await jobOrdersRepository.findById(id);

  if (!existingJobOrder) {
    const error = new Error("Job Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  await jobOrdersRepository.deleteById(id);
  return { _id: id };
};

export const createOrLinkCustomerFromJobOrder = async (jobOrder) => {
  if (!jobOrder.salesOrder) {
    return;
  }

  const SalesOrders = (
    await import("../../salesOrders/models/SalesOrders.js")
  ).default;
  const salesOrder = await (SalesOrders as any).findById(jobOrder.salesOrder);

  if (!salesOrder) {
    return;
  }

  const Leads = (await import("../../leads/models/Leads.js")).default;
  const lead = salesOrder.lead ? await (Leads as any).findById(salesOrder.lead) : null;

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
      jobOrders: [jobOrder._id],
      ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
    });

    await (Leads as any).findByIdAndUpdate(lead._id, {
      customer: customer._id,
    });

    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes.js"))
        .default;
      await (Quotes as any).findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  } else {
    await (Customers as any).findByIdAndUpdate(customer._id, {
      $addToSet: {
        salesOrders: salesOrder._id,
        jobOrders: jobOrder._id,
        ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
      },
    });

    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes.js"))
        .default;
      await (Quotes as any).findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  }

  await (SalesOrders as any).findByIdAndUpdate(salesOrder._id, {
    customerNo: customer.customerNo,
  });

  return customer;
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
