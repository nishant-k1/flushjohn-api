import * as salesOrdersRepository from "../repositories/salesOrdersRepository.js";
import * as customersRepository from "../../customers/repositories/customersRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

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

export const createSalesOrder = async (salesOrderData) => {
  if (!salesOrderData.email || !salesOrderData.quoteNo) {
    const error = new Error("Email and Quote Number are required");
    error.name = "ValidationError";
    throw error;
  }

  const createdAt = getCurrentDateTime();
  const salesOrderNo = await generateSalesOrderNumber();

  let customerNo = null;
  const existingCustomer = await customersRepository.findOne({
    email: salesOrderData.email,
  });

  if (existingCustomer) {
    customerNo = existingCustomer.customerNo;
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

  const formattedSalesOrders = salesOrders.map((salesOrder) => {
    const salesOrderObj = salesOrder.toObject
      ? salesOrder.toObject()
      : salesOrder;
    return formatSalesOrderResponse(salesOrderObj, salesOrderObj.lead);
  });

  const totalPages = Math.ceil(total / limit);

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

  return formatSalesOrderResponse(salesOrder, salesOrder.lead);
};

export const updateSalesOrder = async (id, updateData) => {
  const salesOrder = await salesOrdersRepository.updateById(id, {
    ...updateData,
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: getCurrentDateTime(),
  });

  if (!salesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  const updatedSalesOrder = await salesOrdersRepository.findById(id);

  return formatSalesOrderResponse(
    updatedSalesOrder || salesOrder,
    updatedSalesOrder?.lead
  );
};

export const deleteSalesOrder = async (id) => {
  const existingSalesOrder = await salesOrdersRepository.findById(id);

  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  const JobOrder = (await import("../../jobOrders/models/JobOrders/index.js"))
    .default;

  const jobOrdersCount = await JobOrder.countDocuments({
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
    error.details = { jobOrdersCount };
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
