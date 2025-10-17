/**
 * Job Orders Service - Business Logic Layer
 */

import * as jobOrdersRepository from "../repositories/jobOrdersRepository.js";

export const generateJobOrderNumber = async () => {
  const latestJobOrder = await jobOrdersRepository.findOne({}, "jobOrderNo");
  const latestJobOrderNo = latestJobOrder ? latestJobOrder.jobOrderNo : 999;
  return latestJobOrderNo + 1;
};

export const createJobOrder = async (jobOrderData) => {
  // Validate required fields
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

  console.log("🔍 DEBUG - Backend usageType validation:", {
    usageType: jobOrderData.usageType,
    type: typeof jobOrderData.usageType,
    isEmpty: !jobOrderData.usageType,
    isBlank: !jobOrderData.usageType || jobOrderData.usageType.trim() === "",
  });

  if (!jobOrderData.usageType || jobOrderData.usageType.trim() === "") {
    const error = new Error("Usage type is required");
    error.name = "ValidationError";
    throw error;
  }

  // Check if job order already exists for this sales order
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

  const createdAt = new Date();
  const jobOrderNo = await generateJobOrderNumber();

  const newJobOrderData = {
    ...jobOrderData,
    createdAt,
    jobOrderNo,
    emailStatus: "Pending",
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

  const totalPages = Math.ceil(total / limit);

  return {
    data: jobOrders,
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

  return jobOrder;
};

export const updateJobOrder = async (id, updateData) => {
  const jobOrder = await jobOrdersRepository.updateById(id, {
    ...updateData,
    // Only set emailStatus to "Pending" if it's not already set in updateData
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: new Date(),
  });

  if (!jobOrder) {
    const error = new Error("Job Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  return jobOrder;
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

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
