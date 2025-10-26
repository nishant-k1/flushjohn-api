/**
 * Job Orders Service - Business Logic Layer
 */

import * as jobOrdersRepository from "../repositories/jobOrdersRepository.js";
import { getCurrentDateTime, createDate } from "../../../lib/dayjs/index.js";

export const generateJobOrderNumber = async () => {
  const latestJobOrder = await jobOrdersRepository.findOne({}, "jobOrderNo");
  const latestJobOrderNo = latestJobOrder ? latestJobOrder.jobOrderNo : 999;
  return latestJobOrderNo + 1;
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
    // Store lead reference if provided (for relationship tracking)
    lead: jobOrderData.lead || null,
    leadNo: jobOrderData.leadNo || null,
    // Store sales order reference if provided
    salesOrder: jobOrderData.salesOrder || null,
  };

  return await jobOrdersRepository.create(newJobOrderData);
};

export const getAllJobOrders = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
}) => {
  const skip = (page - 1) * limit;

  let query = {};
  if (search) {
    query = {
      $or: [
        { vendorName: { $regex: search, $options: "i" } },
        { vendorPhone: { $regex: search, $options: "i" } },
        { vendorEmail: { $regex: search, $options: "i" } },
        { jobLocation: { $regex: search, $options: "i" } },
      ],
    };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [jobOrders, total] = await Promise.all([
    jobOrdersRepository.findAll({ query, sort, skip, limit }),
    jobOrdersRepository.count(query),
  ]);

  // Flatten lead data for frontend compatibility
  const flattenedJobOrders = jobOrders.map(jobOrder => {
    if (jobOrder.lead) {
      return {
        ...jobOrder,
        fName: jobOrder.lead.fName,
        lName: jobOrder.lead.lName,
        cName: jobOrder.lead.cName,
        email: jobOrder.lead.email,
        phone: jobOrder.lead.phone,
        fax: jobOrder.lead.fax,
        streetAddress: jobOrder.lead.streetAddress,
        city: jobOrder.lead.city,
        state: jobOrder.lead.state,
        zip: jobOrder.lead.zip,
        country: jobOrder.lead.country,
        usageType: jobOrder.lead.usageType,
      };
    }
    return jobOrder;
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: flattenedJobOrders,
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

  // Flatten lead data for frontend compatibility
  if (jobOrder.lead) {
    jobOrder.fName = jobOrder.lead.fName;
    jobOrder.lName = jobOrder.lead.lName;
    jobOrder.cName = jobOrder.lead.cName;
    jobOrder.email = jobOrder.lead.email;
    jobOrder.phone = jobOrder.lead.phone;
    jobOrder.fax = jobOrder.lead.fax;
    jobOrder.streetAddress = jobOrder.lead.streetAddress;
    jobOrder.city = jobOrder.lead.city;
    jobOrder.state = jobOrder.lead.state;
    jobOrder.zip = jobOrder.lead.zip;
    jobOrder.country = jobOrder.lead.country;
    jobOrder.usageType = jobOrder.lead.usageType;
  }

  return jobOrder;
};

export const updateJobOrder = async (id, updateData) => {
  const jobOrder = await jobOrdersRepository.updateById(id, {
    ...updateData,
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: getCurrentDateTime(),
  });

  if (!jobOrder) {
    const error = new Error("Job Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Fetch with populate to get lead data
  const updatedJobOrder = await jobOrdersRepository.findById(id);
  
  // Flatten lead data for frontend compatibility
  if (updatedJobOrder && updatedJobOrder.lead) {
    updatedJobOrder.fName = updatedJobOrder.lead.fName;
    updatedJobOrder.lName = updatedJobOrder.lead.lName;
    updatedJobOrder.cName = updatedJobOrder.lead.cName;
    updatedJobOrder.email = updatedJobOrder.lead.email;
    updatedJobOrder.phone = updatedJobOrder.lead.phone;
    updatedJobOrder.fax = updatedJobOrder.lead.fax;
    updatedJobOrder.streetAddress = updatedJobOrder.lead.streetAddress;
    updatedJobOrder.city = updatedJobOrder.lead.city;
    updatedJobOrder.state = updatedJobOrder.lead.state;
    updatedJobOrder.zip = updatedJobOrder.lead.zip;
    updatedJobOrder.country = updatedJobOrder.lead.country;
    updatedJobOrder.usageType = updatedJobOrder.lead.usageType;
  }

  return updatedJobOrder || jobOrder;
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

/**
 * Create or link customer when job order email is sent
 * Customer is ONLY created when BOTH sales order AND job order emails are sent
 */
export const createOrLinkCustomerFromJobOrder = async (jobOrder) => {
  if (!jobOrder.salesOrder) {
    // No sales order reference, skip
    return;
  }

  // Import here to avoid circular dependency
  const SalesOrders = (
    await import("../../salesOrders/models/SalesOrders/index.js")
  ).default;
  const salesOrder = await SalesOrders.findById(jobOrder.salesOrder);

  if (!salesOrder) {
    return;
  }

  // Get customer data from lead
  const Leads = (await import("../../leads/models/Leads/index.js")).default;
  const lead = salesOrder.lead ? await Leads.findById(salesOrder.lead) : null;

  if (!lead) {
    // No lead data available
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

  // Import here to avoid circular dependency
  const Customers = (await import("../../customers/models/Customers/index.js"))
    .default;

  let customer = await Customers.findOne({
    email: customerData.email,
  });

  if (!customer) {
    // Create customer NOW (both emails are sent)
    const latestCustomer = await Customers.findOne({}, "customerNo");
    const customerNo = latestCustomer ? latestCustomer.customerNo + 1 : 1000;

    customer = await Customers.create({
      ...customerData,
      customerNo,
      salesOrders: [salesOrder._id],
      jobOrders: [jobOrder._id],
      ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
    });

    // Link lead to customer
    await Leads.findByIdAndUpdate(lead._id, {
      customer: customer._id,
    });

    // Link quote to customer if quote exists
    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes/index.js"))
        .default;
      await Quotes.findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  } else {
    // Customer exists, link sales order and job order
    await Customers.findByIdAndUpdate(customer._id, {
      $addToSet: {
        salesOrders: salesOrder._id,
        jobOrders: jobOrder._id,
        ...(salesOrder.quote && { quotes: salesOrder.quote }),
      },
    });

    // Link quote to customer if quote exists
    if (salesOrder.quote) {
      const Quotes = (await import("../../quotes/models/Quotes/index.js"))
        .default;
      await Quotes.findByIdAndUpdate(salesOrder.quote, {
        customer: customer._id,
      });
    }
  }

  // Update sales order with customer number
  await SalesOrders.findByIdAndUpdate(salesOrder._id, {
    customerNo: customer.customerNo,
  });

  return customer;
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
