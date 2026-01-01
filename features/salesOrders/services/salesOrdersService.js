import * as salesOrdersRepository from "../repositories/salesOrdersRepository.js";
import * as customersRepository from "../../customers/repositories/customersRepository.js";
import * as conversationLogRepository from "../../salesAssist/repositories/conversationLogRepository.js";
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

  // Helper function to normalize phone numbers (remove non-digits, get last 10 digits)
  const normalizePhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    // Return last 10 digits (handles numbers with country code like +1 or 1 prefix)
    return digits.slice(-10);
  };

  // Build query to find customer by email OR phone
  const customerQuery = {
    $or: [],
  };

  // Always check by email if provided
  if (salesOrderData.email) {
    customerQuery.$or.push({ email: salesOrderData.email });
  }

  // Add phone number search if phone is provided
  if (salesOrderData.phone) {
    const normalizedPhone = normalizePhone(salesOrderData.phone);
    if (normalizedPhone && normalizedPhone.length === 10) {
      // Create a regex pattern that matches the 10 digits in sequence
      // This handles various phone formats like "(123) 456-7890", "123-456-7890", "1234567890", etc.
      // The pattern looks for the digits in order, allowing for non-digit characters between them
      const phonePattern = normalizedPhone.split("").join("\\D*");
      customerQuery.$or.push({
        phone: { $regex: phonePattern },
      });
    }
  }

  // Only execute query if we have at least one search criteria
  if (customerQuery.$or.length > 0) {
    const existingCustomer = await customersRepository.findOne(customerQuery);

    if (existingCustomer) {
      customerNo = existingCustomer.customerNo;
    }
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

  const createdSalesOrder = await salesOrdersRepository.create(
    newSalesOrderData
  );

  // Update ConversationLog for AI learning - mark as converted
  if (createdSalesOrder.lead) {
    try {
      await conversationLogRepository.updateOnSalesOrderCreated(
        createdSalesOrder.lead,
        createdSalesOrder._id
      );
    } catch (error) {
      // Log but don't fail the sales order creation
      console.error(
        "Error updating ConversationLog on SalesOrder creation:",
        error
      );
    }
  }

  // Create or link customer when sales order is created
  try {
    await createOrLinkCustomerFromSalesOrder(createdSalesOrder);
  } catch (error) {
    // Log but don't fail the sales order creation
    console.error(
      "Error creating/linking customer on SalesOrder creation:",
      error
    );
  }

  return createdSalesOrder;
};

export const getAllSalesOrders = async ({
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
        { salesOrderNo: { $regex: escapedSearch, $options: "i" } },
        { customerNo: { $regex: escapedSearch, $options: "i" } },
        { leadNo: { $regex: escapedSearch, $options: "i" } },
        { "lead.fName": { $regex: escapedSearch, $options: "i" } },
        { "lead.lName": { $regex: escapedSearch, $options: "i" } },
        { "lead.cName": { $regex: escapedSearch, $options: "i" } },
        { "lead.email": { $regex: escapedSearch, $options: "i" } },
        { "lead.phone": { $regex: escapedSearch, $options: "i" } },
        { "lead.usageType": { $regex: escapedSearch, $options: "i" } },
        { customerName: { $regex: escapedSearch, $options: "i" } },
        { customerEmail: { $regex: escapedSearch, $options: "i" } },
        { customerPhone: { $regex: escapedSearch, $options: "i" } },
        { eventLocation: { $regex: escapedSearch, $options: "i" } },
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
  // Get the existing sales order to access the lead reference
  const existingSalesOrder = await salesOrdersRepository.findById(id);
  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  let leadId = updateData.lead || existingSalesOrder.lead;

  // ✅ Separate fields that belong to Lead vs SalesOrder
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

  // ✅ SalesOrder-specific fields (exclude lead-related customer info)
  const salesOrderFields = {
    products: updateData.products,
    deliveryDate: updateData.deliveryDate,
    pickupDate: updateData.pickupDate,
    contactPersonName: updateData.contactPersonName,
    contactPersonPhone: updateData.contactPersonPhone,
    instructions: updateData.instructions,
    note: updateData.note,
    emailStatus: updateData.emailStatus,
    billingCycles: updateData.billingCycles,
  };

  // Remove undefined fields from salesOrderFields
  Object.keys(salesOrderFields).forEach(
    (key) => salesOrderFields[key] === undefined && delete salesOrderFields[key]
  );

  // ✅ Update the SalesOrder with only sales-order-specific fields
  const salesOrder = await salesOrdersRepository.updateById(id, {
    ...salesOrderFields,
    ...(leadId && { lead: leadId }),
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

export const cancelSalesOrder = async (id) => {
  const existingSalesOrder = await salesOrdersRepository.findById(id);

  if (!existingSalesOrder) {
    const error = new Error("Sales Order not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Check if already cancelled
  if (existingSalesOrder.status === "cancelled") {
    const error = new Error("Sales Order is already cancelled");
    error.name = "AlreadyCancelledError";
    throw error;
  }

  // Check if there are any payments that haven't been fully refunded
  const Payments = (await import("../../payments/models/Payments/index.js"))
    .default;

  const payments = await Payments.find({
    salesOrder: id,
    status: { $in: ["succeeded", "partially_refunded"] },
  });

  // Check if any payment has outstanding refund amount
  const hasUnrefundedPayments = payments.some((payment) => {
    const refundedAmount = payment.refundedAmount || 0;
    return payment.amount > refundedAmount;
  });

  if (hasUnrefundedPayments) {
    const error = new Error(
      "Cannot cancel sales order. Please refund all payments before cancelling."
    );
    error.name = "UnrefundedPaymentsError";
    throw error;
  }

  // Update sales order status to cancelled
  const updatedSalesOrder = await salesOrdersRepository.updateById(id, {
    status: "cancelled",
  });

  return updatedSalesOrder;
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

export const createOrLinkCustomerFromSalesOrder = async (salesOrder) => {
  if (!salesOrder.lead) {
    return;
  }

  const Leads = (await import("../../leads/models/Leads/index.js")).default;
  const lead = await Leads.findById(salesOrder.lead);

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

  await salesOrdersRepository.updateById(salesOrder._id, {
    customerNo: customer.customerNo,
    customer: customer._id,
  });

  return customer;
};
