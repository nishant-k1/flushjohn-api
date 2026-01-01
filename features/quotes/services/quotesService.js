import * as quotesRepository from "../repositories/quotesRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

export const generateQuoteNumber = async () => {
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const latestQuote = await quotesRepository.findOne({}, "quoteNo");
      const latestQuoteNo = latestQuote ? latestQuote.quoteNo : 999;
      const newQuoteNo = latestQuoteNo + 1;

      // Verify uniqueness by checking if this number exists
      const existingQuote = await quotesRepository.findOne({
        quoteNo: newQuoteNo,
      });
      if (!existingQuote) {
        return newQuoteNo;
      }

      // If duplicate found, wait a bit and retry
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw new Error("Failed to generate unique quote number after retries");
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * attempts));
    }
  }

  throw new Error("Failed to generate unique quote number");
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
      const parsed = parseInt(numericPart);
      leadNo = !isNaN(parsed) ? parsed : null;
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
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { quoteNo: { $regex: escapedSearch, $options: "i" } },
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
      { eventCity: { $regex: escapedSearch, $options: "i" } },
      { eventState: { $regex: escapedSearch, $options: "i" } },
      { deliveryDate: { $regex: escapedSearch, $options: "i" } },
      { pickupDate: { $regex: escapedSearch, $options: "i" } },
      { emailStatus: { $regex: escapedSearch, $options: "i" } },
      { contactPersonName: { $regex: escapedSearch, $options: "i" } },
      { contactPersonPhone: { $regex: escapedSearch, $options: "i" } },
      { instructions: { $regex: escapedSearch, $options: "i" } },
      { note: { $regex: escapedSearch, $options: "i" } },
    ];

    // Search numeric fields if search term is numeric
    const numericSearch = Number.isFinite(Number(search)) ? Number(search) : null;
    if (numericSearch !== null) {
      searchConditions.push({ quoteNo: numericSearch });
    }

    // Try to parse as date and search createdAt
    try {
      const searchDate = new Date(search);
      if (!isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);
        searchConditions.push({
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });
      }
    } catch (e) {
      // Ignore date parsing errors
    }

    query = {
      $or: searchConditions,
    };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [quotes, total] = await Promise.all([
    quotesRepository.findAll({ query, sort, skip, limit }),
    quotesRepository.count(query),
  ]);

  // ✅ OPTIMIZED: Batch fetch leads instead of N+1 queries
  const quotesNeedingLeads = quotes.filter(
    (quote) => !quote.lead && quote.leadNo
  );

  let leadsMap = new Map();
  if (quotesNeedingLeads.length > 0) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    const leadNumbers = quotesNeedingLeads
      .map((quote) => {
        let leadNo = quote.leadNo;
        if (typeof leadNo === "string") {
          const numericPart = leadNo.replace(/\D/g, "");
          const parsed = parseInt(numericPart);
          leadNo = !isNaN(parsed) ? parsed : null;
        }
        return leadNo;
      })
      .filter(Boolean);

    if (leadNumbers.length > 0) {
      // ✅ Batch fetch all leads in one query
      const leads = await Leads.find({ leadNo: { $in: leadNumbers } }).lean();
      leads.forEach((lead) => {
        leadsMap.set(lead.leadNo, lead);
      });
    }
  }

  // ✅ Map leads to quotes efficiently
  const flattenedQuotes = quotes.map((quote) => {
    const quoteObj = quote.toObject ? quote.toObject() : quote;

    let lead = quote.lead;

    // Use batch-fetched lead if available
    if (!lead && quoteObj.leadNo) {
      let leadNo = quoteObj.leadNo;
      if (typeof leadNo === "string") {
        const numericPart = leadNo.replace(/\D/g, "");
        const parsed = parseInt(numericPart);
        leadNo = !isNaN(parsed) ? parsed : null;
      }
      if (leadNo) {
        lead = leadsMap.get(leadNo);
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

  let lead = quote.lead;

  if (!lead && quote.leadNo) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    let leadNo = quote.leadNo;

    if (typeof leadNo === "string") {
      const numericPart = leadNo.replace(/\D/g, "");
      const parsed = parseInt(numericPart);
      leadNo = !isNaN(parsed) ? parsed : null;
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

  // Get the existing quote to access the lead reference
  const existingQuote = await quotesRepository.findById(id);
  if (!existingQuote) {
    const error = new Error("Quote not found");
    error.name = "NotFoundError";
    throw error;
  }

  let leadId = updateData.lead || updateData.leadId || existingQuote.lead;
  if (!leadId && updateData.leadNo) {
    const Leads = (await import("../../leads/models/Leads/index.js")).default;
    let leadNo = updateData.leadNo;

    if (typeof leadNo === "string") {
      const numericPart = leadNo.replace(/\D/g, "");
      const parsed = parseInt(numericPart);
      leadNo = !isNaN(parsed) ? parsed : null;
    }

    if (leadNo) {
      const lead = await Leads.findOne({ leadNo });
      if (lead) {
        leadId = lead._id;
      }
    }
  }

  // ✅ Separate fields that belong to Lead vs Quote
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

  // ✅ Quote-specific fields (exclude lead-related customer info)
  const quoteFields = {
    products: updateData.products,
    deliveryDate: updateData.deliveryDate,
    pickupDate: updateData.pickupDate,
    contactPersonName: updateData.contactPersonName,
    contactPersonPhone: updateData.contactPersonPhone,
    instructions: updateData.instructions,
    note: updateData.note,
    emailStatus: updateData.emailStatus,
  };

  // Remove undefined fields from quoteFields
  Object.keys(quoteFields).forEach(
    (key) => quoteFields[key] === undefined && delete quoteFields[key]
  );

  // ✅ Update the Quote with only quote-specific fields
  const quote = await quotesRepository.updateById(id, {
    ...quoteFields,
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
