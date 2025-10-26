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
 * Create or update customer when sales order email is sent
 * Links the customer to the lead if lead reference exists
 */
export const createOrLinkCustomerFromSalesOrder = async (salesOrder, leadId = null) => {
  // Get customer data from sales order or from lead reference
  let customerData = {};
  
  // Try to get data from sales order (may have legacy fields)
  customerData = {
    fName: salesOrder.fName,
    lName: salesOrder.lName,
    cName: salesOrder.cName,
    email: salesOrder.email,
    phone: salesOrder.phone,
    fax: salesOrder.fax,
    streetAddress: salesOrder.streetAddress,
    city: salesOrder.city,
    state: salesOrder.state,
    zip: salesOrder.zip,
    country: salesOrder.country || "USA",
  };

  // If we have a lead reference, populate and use lead data
  if (salesOrder.lead) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    const lead = await Leads.findById(salesOrder.lead);
    
    if (lead) {
      // Use lead data if available
      customerData = {
        fName: lead.fName || customerData.fName,
        lName: lead.lName || customerData.lName,
        cName: lead.cName || customerData.cName,
        email: lead.email || customerData.email,
        phone: lead.phone || customerData.phone,
        fax: lead.fax || customerData.fax,
        streetAddress: lead.streetAddress || customerData.streetAddress,
        city: lead.city || customerData.city,
        state: lead.state || customerData.state,
        zip: lead.zip || customerData.zip,
        country: lead.country || customerData.country || "USA",
      };
    }
  }

  let customer = await customersRepository.findOne({
    email: customerData.email,
  });

  if (!customer) {
    // Create new customer
    const latestCustomer = await customersRepository.findOne({}, "customerNo");
    const customerNo = latestCustomer ? latestCustomer.customerNo + 1 : 1000;

    customer = await customersRepository.create({
      ...customerData,
      customerNo,
      // Add sales order reference
      salesOrders: [salesOrder._id],
      // Add quote reference if exists
      ...(salesOrder.quote && { quotes: [salesOrder.quote] }),
    });
  } else {
    // Update existing customer and add sales order reference
    customer = await customersRepository.findOneAndUpdate(
      { email: customerData.email },
      {
        $addToSet: {
          salesOrders: salesOrder._id,
          ...(salesOrder.quote && { quotes: salesOrder.quote }),
        },
      },
      { new: true }
    );
  }

  // Link lead to customer if leadId is provided
  if (leadId) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    await Leads.findByIdAndUpdate(leadId, {
      customer: customer._id,
    });
  }

  // Update sales order with customer number
  await salesOrdersRepository.updateById(salesOrder._id, {
    customerNo: customer.customerNo,
  });

  return customer;
};
