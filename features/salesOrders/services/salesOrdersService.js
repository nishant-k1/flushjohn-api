/**
 * Sales Orders Service - Business Logic Layer
 */

import * as salesOrdersRepository from "../repositories/salesOrdersRepository.js";
import * as customersRepository from "../../customers/repositories/customersRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

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
  if (!salesOrderData.email || !salesOrderData.quoteNo) {
    const error = new Error("Email and Quote Number are required");
    error.name = "ValidationError";
    throw error;
  }

  const createdAt = getCurrentDateTime();
  const salesOrderNo = await generateSalesOrderNumber();

  // Don't create customer here - customers are created when email is sent
  // Check if customer exists to get customerNo for reference
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
    customerNo: customerNo, // May be null if customer doesn't exist yet
    emailStatus: "Pending",
    // Store lead reference if provided (for relationship tracking)
    lead: salesOrderData.lead || null,
    leadNo: salesOrderData.leadNo || null,
    // Store quote reference if provided
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

  // Flatten lead data for frontend compatibility
  const flattenedSalesOrders = salesOrders.map(salesOrder => {
    if (salesOrder.lead) {
      return {
        ...salesOrder,
        fName: salesOrder.lead.fName,
        lName: salesOrder.lead.lName,
        cName: salesOrder.lead.cName,
        email: salesOrder.lead.email,
        phone: salesOrder.lead.phone,
        fax: salesOrder.lead.fax,
        streetAddress: salesOrder.lead.streetAddress,
        city: salesOrder.lead.city,
        state: salesOrder.lead.state,
        zip: salesOrder.lead.zip,
        country: salesOrder.lead.country,
        usageType: salesOrder.lead.usageType,
      };
    }
    return salesOrder;
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: flattenedSalesOrders,
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

  // Flatten lead data for frontend compatibility
  if (salesOrder.lead) {
    salesOrder.fName = salesOrder.lead.fName;
    salesOrder.lName = salesOrder.lead.lName;
    salesOrder.cName = salesOrder.lead.cName;
    salesOrder.email = salesOrder.lead.email;
    salesOrder.phone = salesOrder.lead.phone;
    salesOrder.fax = salesOrder.lead.fax;
    salesOrder.streetAddress = salesOrder.lead.streetAddress;
    salesOrder.city = salesOrder.lead.city;
    salesOrder.state = salesOrder.lead.state;
    salesOrder.zip = salesOrder.lead.zip;
    salesOrder.country = salesOrder.lead.country;
    salesOrder.usageType = salesOrder.lead.usageType;
  }

  return salesOrder;
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

  return salesOrder;
};

export const deleteSalesOrder = async (id) => {
  const existingSalesOrder = await salesOrdersRepository.findById(id);

  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Check for related job orders
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

/**
 * DO NOT create customer when sales order email is sent
 * Customer is only created when BOTH sales order AND job order emails are sent
 * This function just links the sales order to any existing customer
 */
export const linkSalesOrderToCustomer = async (salesOrder, leadId = null) => {
  // Check if customer already exists
  const existingCustomer = await customersRepository.findOne({
    email: salesOrder.email,
  });

  if (existingCustomer) {
    // Customer exists, just link sales order to it
    await customersRepository.findOneAndUpdate(
      { email: salesOrder.email },
      {
        $addToSet: {
          salesOrders: salesOrder._id,
          ...(salesOrder.quote && { quotes: salesOrder.quote }),
        },
      }
    );

    // Update sales order with customer number
    await salesOrdersRepository.updateById(salesOrder._id, {
      customerNo: existingCustomer.customerNo,
    });

    return existingCustomer;
  }

  // No customer exists yet - customer will be created when job order email is sent
  // Just return null for now
  return null;
};
