import * as jobOrdersRepository from "../repositories/jobOrdersRepository.js";
import { getCurrentDateTime, createDate } from "../../../lib/dayjs/index.js";

export const generateJobOrderNumber = async () => {
  const latestJobOrder = await jobOrdersRepository.findOne({}, "jobOrderNo");
  const latestJobOrderNo = latestJobOrder ? latestJobOrder.jobOrderNo : 999;
  return latestJobOrderNo + 1;
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
    const customerNo = latestCustomer ? latestCustomer.customerNo + 1 : 1000;

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
        ...(salesOrder.quote && { quotes: salesOrder.quote }),
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
