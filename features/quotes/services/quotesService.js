import * as quotesRepository from "../repositories/quotesRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

export const generateQuoteNumber = async () => {
  const latestQuote = await quotesRepository.findOne({}, "quoteNo");
  const latestQuoteNo = latestQuote ? latestQuote.quoteNo : 999;
  return latestQuoteNo + 1;
};

const formatQuoteResponse = (quote, lead) => {
  const quoteObj = quote.toObject ? quote.toObject() : quote;

  if (!lead) {
    return quoteObj;
  }

  const leadObj = lead.toObject ? lead.toObject() : lead;

  return {
    ...quoteObj,
    lead: leadObj,
  };
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

  let leadId = quoteData.lead || quoteData.leadId;

  if (!leadId && quoteData.leadNo) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    let leadNo = quoteData.leadNo;

    if (typeof leadNo === "string") {
      const numericPart = leadNo.replace(/\D/g, "");
      leadNo = numericPart ? parseInt(numericPart) : null;
    }

    if (leadNo) {
      const lead = await Leads.findOne({ leadNo });
      if (lead) {
        leadId = lead._id;
      }
    }
  }

  const newQuoteData = {
    ...quoteData,
    createdAt,
    quoteNo,
    emailStatus: "Pending",
  };

  if (leadId) {
    newQuoteData.lead = leadId;
  }

  const quote = await quotesRepository.create(newQuoteData);

  const populatedQuote = await quotesRepository.findById(quote._id);

  return formatQuoteResponse(populatedQuote, populatedQuote.lead);
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

  const flattenedQuotes = await Promise.all(
    quotes.map(async (quote) => {
      const quoteObj = quote.toObject();

      let lead = quote.lead;

      if (!lead && quoteObj.leadNo) {
        const Leads = (await import("../../leads/models/Leads/index.js"))
          .default;
        let leadNo = quoteObj.leadNo;

        if (typeof leadNo === "string") {
          const numericPart = leadNo.replace(/\D/g, "");
          leadNo = numericPart ? parseInt(numericPart) : null;
        }

        if (leadNo) {
          lead = await Leads.findOne({ leadNo });
        }
      }

      if (lead) {
        const leadObj = lead.toObject ? lead.toObject() : lead;
        return {
          ...quoteObj,
          lead: leadObj,
        };
      }
      return quoteObj;
    })
  );

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

  let lead = quote.lead;

  if (!lead && quote.leadNo) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    let leadNo = quote.leadNo;

    if (typeof leadNo === "string") {
      const numericPart = leadNo.replace(/\D/g, "");
      leadNo = numericPart ? parseInt(numericPart) : null;
    }

    if (leadNo) {
      lead = await Leads.findOne({ leadNo });
    }
  }

  return formatQuoteResponse(quote, lead);
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

  let leadId = updateData.lead || updateData.leadId;
  if (!leadId && updateData.leadNo) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    let leadNo = updateData.leadNo;

    if (typeof leadNo === "string") {
      const numericPart = leadNo.replace(/\D/g, "");
      leadNo = numericPart ? parseInt(numericPart) : null;
    }

    if (leadNo) {
      const lead = await Leads.findOne({ leadNo });
      if (lead) {
        leadId = lead._id;
      }
    }
  }

  const quote = await quotesRepository.updateById(id, {
    ...updateData,
    ...(leadId && { lead: leadId }),
    ...(updateData.emailStatus === undefined && { emailStatus: "Pending" }),
    updatedAt: getCurrentDateTime(),
  });

  if (!quote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  const updatedQuote = await quotesRepository.findById(id);

  return formatQuoteResponse(updatedQuote || quote, updatedQuote?.lead);
};

export const deleteQuote = async (id) => {
  const existingQuote = await quotesRepository.findById(id);

  if (!existingQuote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

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
