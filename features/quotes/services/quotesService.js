/**
 * Quotes Service - Business Logic Layer
 */

import * as quotesRepository from "../repositories/quotesRepository.js";

export const generateQuoteNumber = async () => {
  const latestQuote = await quotesRepository.findOne({}, "quoteNo");
  const latestQuoteNo = latestQuote ? latestQuote.quoteNo : 999;
  return latestQuoteNo + 1;
};

export const createQuote = async (quoteData) => {
  const createdAt = new Date();
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

  // Build search query
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

  // Build sort object
  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [quotes, total] = await Promise.all([
    quotesRepository.findAll({ query, sort, skip, limit }),
    quotesRepository.count(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: quotes,
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

  return quote;
};

export const updateQuote = async (id, updateData) => {
  const quote = await quotesRepository.updateById(id, {
    ...updateData,
    emailStatus: "Pending",
    updatedAt: new Date(),
  });

  if (!quote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  return quote;
};

export const deleteQuote = async (id) => {
  const existingQuote = await quotesRepository.findById(id);
  
  if (!existingQuote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  await quotesRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
