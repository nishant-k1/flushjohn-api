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

  // Flatten lead data for frontend compatibility (from quote.lead)
  const flattenedSalesOrders = salesOrders.map((salesOrder) => {
    const lead = salesOrder.quote?.lead;
    if (lead) {
      return {
        ...salesOrder,
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
        country: lead.country,
        usageType: lead.usageType,
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

  // Flatten lead data for frontend compatibility (from quote.lead)
  const lead = salesOrder.quote?.lead;
  if (lead) {
    salesOrder.fName = lead.fName;
    salesOrder.lName = lead.lName;
    salesOrder.cName = lead.cName;
    salesOrder.email = lead.email;
    salesOrder.phone = lead.phone;
    salesOrder.fax = lead.fax;
    salesOrder.streetAddress = lead.streetAddress;
    salesOrder.city = lead.city;
    salesOrder.state = lead.state;
    salesOrder.zip = lead.zip;
    salesOrder.country = lead.country;
    salesOrder.usageType = lead.usageType;
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

  // Fetch with populate to get lead data
  const updatedSalesOrder = await salesOrdersRepository.findById(id);

  // Flatten lead data for frontend compatibility (from quote.lead)
  const lead = updatedSalesOrder?.quote?.lead;
  if (updatedSalesOrder && lead) {
    updatedSalesOrder.fName = lead.fName;
    updatedSalesOrder.lName = lead.lName;
    updatedSalesOrder.cName = lead.cName;
    updatedSalesOrder.email = lead.email;
    updatedSalesOrder.phone = lead.phone;
    updatedSalesOrder.fax = lead.fax;
    updatedSalesOrder.streetAddress = lead.streetAddress;
    updatedSalesOrder.city = lead.city;
    updatedSalesOrder.state = lead.state;
    updatedSalesOrder.zip = lead.zip;
    updatedSalesOrder.country = lead.country;
    updatedSalesOrder.usageType = lead.usageType;
  }

  return updatedSalesOrder || salesOrder;
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
