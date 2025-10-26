/**
 * Quotes Service - Business Logic Layer
 */

import * as quotesRepository from "../repositories/quotesRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

export const generateQuoteNumber = async () => {
  const latestQuote = await quotesRepository.findOne({}, "quoteNo");
  const latestQuoteNo = latestQuote ? latestQuote.quoteNo : 999;
  return latestQuoteNo + 1;
};

export const createQuote = async (quoteData) => {
  if (
    !quoteData.usageType ||
    quoteData.usageType.trim() === "" ||
    quoteData.usageType === "None"
  ) {
    const error = new Error("Usage type is required");
    error.name = "ValidationError";
    throw error;
  }

  const createdAt = getCurrentDateTime();
  const quoteNo = await generateQuoteNumber();

  const newQuoteData = {
    ...quoteData,
    createdAt,
    quoteNo,
    emailStatus: "Pending",
  };

  return await quotesRepository.create(newQuoteData);
};

export const getAllQuotes = async ({
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
        { eventCity: { $regex: search, $options: "i" } },
        { eventState: { $regex: search, $options: "i" } },
      ],
    };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [quotes, total] = await Promise.all([
    quotesRepository.findAll({ query, sort, skip, limit }),
    quotesRepository.count(query),
  ]);

  // Flatten lead data for frontend compatibility
  const flattenedQuotes = quotes.map(quote => {
    if (quote.lead) {
      return {
        ...quote.toObject(),
        fName: quote.lead.fName,
        lName: quote.lead.lName,
        cName: quote.lead.cName,
        email: quote.lead.email,
        phone: quote.lead.phone,
        fax: quote.lead.fax,
        streetAddress: quote.lead.streetAddress,
        city: quote.lead.city,
        state: quote.lead.state,
        zip: quote.lead.zip,
        country: quote.lead.country,
        usageType: quote.lead.usageType,
      };
    }
    return quote;
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: flattenedQuotes,
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

export const getQuoteById = async (id) => {
  const quote = await quotesRepository.findById(id);

  if (!quote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Flatten lead data for frontend compatibility
  if (quote.lead) {
    quote.fName = quote.lead.fName;
    quote.lName = quote.lead.lName;
    quote.cName = quote.lead.cName;
    quote.email = quote.lead.email;
    quote.phone = quote.lead.phone;
    quote.fax = quote.lead.fax;
    quote.streetAddress = quote.lead.streetAddress;
    quote.city = quote.lead.city;
    quote.state = quote.lead.state;
    quote.zip = quote.lead.zip;
    quote.country = quote.lead.country;
    quote.usageType = quote.lead.usageType;
  }

  return quote;
};

export const updateQuote = async (id, updateData) => {
  if (
    updateData.usageType !== undefined &&
    (!updateData.usageType ||
      updateData.usageType.trim() === "" ||
      updateData.usageType === "None")
  ) {
    const error = new Error("Usage type is required");
    error.name = "ValidationError";
    throw error;
  }

  const quote = await quotesRepository.updateById(id, {
    ...updateData,
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: getCurrentDateTime(),
  });

  if (!quote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Fetch with populate to get lead data
  const updatedQuote = await quotesRepository.findById(id);
  
  // Flatten lead data for frontend compatibility
  if (updatedQuote && updatedQuote.lead) {
    updatedQuote.fName = updatedQuote.lead.fName;
    updatedQuote.lName = updatedQuote.lead.lName;
    updatedQuote.cName = updatedQuote.lead.cName;
    updatedQuote.email = updatedQuote.lead.email;
    updatedQuote.phone = updatedQuote.lead.phone;
    updatedQuote.fax = updatedQuote.lead.fax;
    updatedQuote.streetAddress = updatedQuote.lead.streetAddress;
    updatedQuote.city = updatedQuote.lead.city;
    updatedQuote.state = updatedQuote.lead.state;
    updatedQuote.zip = updatedQuote.lead.zip;
    updatedQuote.country = updatedQuote.lead.country;
    updatedQuote.usageType = updatedQuote.lead.usageType;
  }

  return updatedQuote || quote;
};

export const deleteQuote = async (id) => {
  const existingQuote = await quotesRepository.findById(id);

  if (!existingQuote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  // Check for related sales orders
  const SalesOrder = (
    await import("../../salesOrders/models/SalesOrders/index.js")
  ).default;

  const salesOrdersCount = await SalesOrder.countDocuments({
    $or: [{ quote: id }, { quoteNo: existingQuote.quoteNo }],
  });

  if (salesOrdersCount > 0) {
    const error = new Error(
      `Cannot delete quote. Related records exist: ${salesOrdersCount} sales order(s). ` +
        `Please delete these records first or contact an administrator.`
    );
    error.name = "DeletionBlockedError";
    error.details = { salesOrdersCount };
    throw error;
  }

  await quotesRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
