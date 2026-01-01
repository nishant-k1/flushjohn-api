import * as jobOrdersRepository from "../repositories/jobOrdersRepository.js";
import * as conversationLogRepository from "../../salesAssist/repositories/conversationLogRepository.js";
import { getCurrentDateTime, createDate } from "../../../lib/dayjs/index.js";

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

export const getAllJobOrders = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
  startDate = null,
  endDate = null,
}) => {
  const skip = (page - 1) * limit;

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
  
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchQuery = {
      $or: [
        { jobOrderNo: { $regex: escapedSearch, $options: "i" } },
        { customerNo: { $regex: escapedSearch, $options: "i" } },
        { "vendor.name": { $regex: escapedSearch, $options: "i" } },
        { "lead.fName": { $regex: escapedSearch, $options: "i" } },
        { "lead.lName": { $regex: escapedSearch, $options: "i" } },
        { "lead.cName": { $regex: escapedSearch, $options: "i" } },
        { "lead.email": { $regex: escapedSearch, $options: "i" } },
        { "lead.phone": { $regex: escapedSearch, $options: "i" } },
        { "lead.usageType": { $regex: escapedSearch, $options: "i" } },
        { jobLocation: { $regex: escapedSearch, $options: "i" } },
        { deliveryDate: { $regex: escapedSearch, $options: "i" } },
        { pickupDate: { $regex: escapedSearch, $options: "i" } },
        { emailStatus: { $regex: escapedSearch, $options: "i" } },
      ],
    };
    
    // Combine date filter with search query
    if (Object.keys(query).length > 0 && Object.keys(query).includes('createdAt')) {
      query = { $and: [query, searchQuery] };
    } else {
      query = { ...query, ...searchQuery };
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
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    await Leads.findByIdAndUpdate(
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
    await import("../../salesOrders/models/SalesOrders/index.js")
  ).default;
  const salesOrder = await SalesOrders.findById(jobOrder.salesOrder);

  if (!salesOrder) {
    return;
  }

  const Leads = (await import("../../leads/models/Leads/index.js")).default;
  const lead = salesOrder.lead ? await Leads.findById(salesOrder.lead) : null;

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

  const Customers = (await import("../../customers/models/Customers/index.js"))
    .default;

  let customer = await Customers.findOne({
    email: customerData.email,
  });

  if (!customer) {
    const latestCustomer = await Customers.findOne({}, "customerNo");
    const customerNo = latestCustomer?.customerNo
      ? latestCustomer.customerNo + 1
      : 1000;

    customer = await Customers.create({
      ...customerData,
      customerNo,
      salesOrders: [salesOrder._id],
      jobOrders: [jobOrder._id],
      ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
    });

    await Leads.findByIdAndUpdate(lead._id, {
      customer: customer._id,
    });

    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes/index.js"))
        .default;
      await Quotes.findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  } else {
    await Customers.findByIdAndUpdate(customer._id, {
      $addToSet: {
        salesOrders: salesOrder._id,
        jobOrders: jobOrder._id,
        ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
      },
    });

    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes/index.js"))
        .default;
      await Quotes.findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  }

  await SalesOrders.findByIdAndUpdate(salesOrder._id, {
    customerNo: customer.customerNo,
  });

  return customer;
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
