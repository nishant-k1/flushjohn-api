/**
 * Sales Orders Service - Business Logic Layer
 */

import * as salesOrdersRepository from "../repositories/salesOrdersRepository.js";
import * as customersRepository from "../../customers/repositories/customersRepository.js";

export const generateSalesOrderNumber = async () => {
  const latestSalesOrder = await salesOrdersRepository.findOne(
    {},
    "salesOrderNo"
  );
  const latestSalesOrderNo = latestSalesOrder
    ? latestSalesOrder.salesOrderNo
    : 999;
  return latestSalesOrderNo + 1;
};

export const createSalesOrder = async (salesOrderData) => {
  // Validate required fields
  if (!salesOrderData.email || !salesOrderData.quoteNo) {
    const error = new Error("Email and Quote Number are required");
    error.name = "ValidationError";
    throw error;
  }

  const createdAt = new Date();
  const salesOrderNo = await generateSalesOrderNumber();

  // Handle customer creation/update logic
  let customer = await customersRepository.findOne({
    email: salesOrderData.email,
  });

  if (!customer) {
    // Create new customer
    const latestCustomer = await customersRepository.findOne({}, "customerNo");
    const customerNo = latestCustomer ? latestCustomer.customerNo + 1 : 1000;

    customer = await customersRepository.create({
      ...salesOrderData,
      createdAt,
      customerNo,
      salesOrderNo: [salesOrderNo],
      quoteNo: [salesOrderData.quoteNo] || [],
    });
  } else {
    // Update existing customer
    const { quoteNo, salesOrderNo: _, ...customerData } = salesOrderData;

    customer = await customersRepository.findOneAndUpdate(
      { email: salesOrderData.email },
      {
        $set: customerData,
        $push: {
          salesOrderNo: salesOrderNo,
          quoteNo: salesOrderData.quoteNo,
        },
      }
    );
  }

  // Create sales order
  const newSalesOrderData = {
    ...salesOrderData,
    createdAt,
    salesOrderNo,
    customerNo: customer.customerNo,
    emailStatus: "Pending",
  };

  return await salesOrdersRepository.create(newSalesOrderData);
};

export const getAllSalesOrders = async ({
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
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
        { eventLocation: { $regex: search, $options: "i" } },
      ],
    };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [salesOrders, total] = await Promise.all([
    salesOrdersRepository.findAll({ query, sort, skip, limit }),
    salesOrdersRepository.count(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: salesOrders,
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

  return salesOrder;
};

export const updateSalesOrder = async (id, updateData) => {
  const salesOrder = await salesOrdersRepository.updateById(id, {
    ...updateData,
    // Set emailStatus to "Pending" only if not explicitly provided in updateData
    // This allows email operations to set "Sent" and regular saves to reset to "Pending"
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: new Date(),
  });

  if (!salesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  return salesOrder;
};

export const deleteSalesOrder = async (id) => {
  const existingSalesOrder = await salesOrdersRepository.findById(id);

  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  await salesOrdersRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
