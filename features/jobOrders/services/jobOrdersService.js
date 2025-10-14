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
  console.log("🔍 Job Order Service - Received data:", JSON.stringify(jobOrderData, null, 2));
  console.log("🔍 Job Order Service - Vendor data:", jobOrderData.vendor);
  
  // Validate required fields
  if (!jobOrderData.salesOrderNo) {
    const error = new Error("Sales Order Number is required");
    error.name = "ValidationError";
    throw error;
  }

  // Check if job order already exists for this sales order
  console.log(`🔍 Checking for existing job order with salesOrderNo: ${jobOrderData.salesOrderNo}`);
  const existingJobOrder = await jobOrdersRepository.findOne({
    salesOrderNo: jobOrderData.salesOrderNo,
  });

  if (existingJobOrder) {
    console.log(`⚠️ Job Order already exists: ${existingJobOrder._id} (JO #${existingJobOrder.jobOrderNo})`);
    const error = new Error("A job order already exists for this sales order");
    error.name = "DuplicateError";
    error.existingJobOrderId = existingJobOrder._id;
    error.jobOrderNo = existingJobOrder.jobOrderNo;
    throw error;
  }

  console.log(`✅ No existing job order found for sales order ${jobOrderData.salesOrderNo}, proceeding with creation`);

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
    emailStatus: "Pending",
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
