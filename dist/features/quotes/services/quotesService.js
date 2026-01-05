import * as quotesRepository from "../repositories/quotesRepository.js";
import { getCurrentDateTime, dayjs } from "../../../lib/dayjs.js";
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
        }
        catch {
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
    if (!quoteData.usageType ||
        quoteData.usageType.trim() === "" ||
        quoteData.usageType === "None") {
        const error = new Error("Usage type is required");
        error.name = "ValidationError";
        throw error;
    }
    const createdAt = getCurrentDateTime();
    const quoteNo = await generateQuoteNumber();
    let leadId = quoteData.lead || quoteData.leadId;
    if (!leadId && quoteData.leadNo) {
        const Leads = (await import("../../leads/models/Leads.js")).default;
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
/**
 * Get all quotes using aggregation pipeline with $lookup for lead data
 * This enables searching by lead fields (fName, lName, cName, email, phone, usageType)
 */
const getAllQuotesWithAggregation = async ({ page, limit, sortBy, sortOrder, search, columnFilters, }) => {
    const skip = (page - 1) * limit;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Import Quotes model
    const Quotes = (await import("../models/Quotes.js")).default;
    // Build aggregation pipeline
    const pipeline = [];
    // Step 1: JOIN leads collection FIRST (before any filtering)
    pipeline.push({
        $lookup: {
            from: "leads",
            localField: "lead",
            foreignField: "_id",
            as: "leadData",
        },
    });
    // Step 2: Flatten leadData array
    pipeline.push({
        $unwind: {
            path: "$leadData",
            preserveNullAndEmptyArrays: true,
        },
    });
    // Step 3: Build match conditions for column filters
    const columnFilterConditions = {};
    const columnFilterExpr = [];
    // Fields directly in quotes collection
    const quoteFieldFilters = [
        "quoteNo",
        "leadNo",
        "emailStatus",
        "deliveryDate",
        "pickupDate",
        "contactPersonName",
        "contactPersonPhone",
        "instructions",
        "note",
        "createdAt",
    ];
    // Lead fields (now available via $lookup as leadData)
    const leadFieldFilters = [
        "fName",
        "lName",
        "cName",
        "email",
        "phone",
        "usageType",
    ];
    const allowedColumnFilters = [...quoteFieldFilters, ...leadFieldFilters];
    Object.keys(columnFilters).forEach((key) => {
        if (allowedColumnFilters.includes(key) && columnFilters[key]) {
            const filterValue = String(columnFilters[key]).trim();
            if (filterValue) {
                // Determine the field path (quotes fields vs lead fields)
                const isLeadField = leadFieldFilters.includes(key);
                const fieldPath = isLeadField ? `leadData.${key}` : key;
                // For date fields, try to parse with multiple formats
                if (key === "createdAt" ||
                    key === "deliveryDate" ||
                    key === "pickupDate") {
                    const hasYear = /\d{4}/.test(filterValue);
                    let parsedDate = null;
                    if (hasYear) {
                        const dateFormats = [
                            "MMMM D, YYYY",
                            "MMMM D YYYY",
                            "MMM D, YYYY",
                            "MMM D YYYY",
                            "MM/DD/YYYY",
                            "MM-DD-YYYY",
                            "YYYY-MM-DD",
                            "M/D/YYYY",
                            "M-D-YYYY",
                            "D MMMM YYYY",
                            "D MMM YYYY",
                        ];
                        for (const format of dateFormats) {
                            const testDate = dayjs(filterValue, format, true);
                            if (testDate.isValid()) {
                                parsedDate = testDate;
                                break;
                            }
                        }
                        if (!parsedDate || !parsedDate.isValid()) {
                            const standardDate = new Date(filterValue);
                            if (!isNaN(standardDate.getTime())) {
                                parsedDate = dayjs(standardDate);
                            }
                        }
                    }
                    if (parsedDate && parsedDate.isValid() && hasYear) {
                        const startOfDay = parsedDate.startOf("day").toDate();
                        const endOfDay = parsedDate.endOf("day").toDate();
                        columnFilterConditions[fieldPath] = {
                            $gte: startOfDay,
                            $lte: endOfDay,
                        };
                    }
                    else {
                        // Partial date matching
                        if (key === "createdAt") {
                            const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            columnFilterExpr.push({
                                $regexMatch: {
                                    input: {
                                        $dateToString: {
                                            format: "%B %d, %Y, %H:%M",
                                            date: `$${fieldPath}`,
                                        },
                                    },
                                    regex: escapedValue,
                                    options: "i",
                                },
                            });
                        }
                        else {
                            const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            columnFilterConditions[fieldPath] = {
                                $regex: escapedValue,
                                $options: "i",
                            };
                        }
                    }
                }
                else if (key === "quoteNo" || key === "leadNo") {
                    // Numeric fields
                    const numericValue = Number.isFinite(Number(filterValue)) &&
                        !isNaN(Number(filterValue)) &&
                        String(Number(filterValue)) === filterValue.trim()
                        ? Number(filterValue)
                        : null;
                    if (numericValue !== null) {
                        columnFilterConditions[fieldPath] = numericValue;
                    }
                    else {
                        const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        columnFilterExpr.push({
                            $regexMatch: {
                                input: { $toString: `$${fieldPath}` },
                                regex: escapedValue,
                                options: "i",
                            },
                        });
                    }
                }
                else {
                    // Text fields (includes lead fields like fName, lName, etc.)
                    const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    columnFilterConditions[fieldPath] = {
                        $regex: escapedValue,
                        $options: "i",
                    };
                }
            }
        }
    });
    // Step 4: Build match conditions for global search (only if search is provided)
    const searchConditions = [];
    if (search && search.trim()) {
        // Search in quote fields (direct fields)
        searchConditions.push({ emailStatus: { $regex: escapedSearch, $options: "i" } }, { customerName: { $regex: escapedSearch, $options: "i" } }, { customerEmail: { $regex: escapedSearch, $options: "i" } }, { customerPhone: { $regex: escapedSearch, $options: "i" } }, { deliveryDate: { $regex: escapedSearch, $options: "i" } }, { pickupDate: { $regex: escapedSearch, $options: "i" } }, { eventLocation: { $regex: escapedSearch, $options: "i" } }, { eventCity: { $regex: escapedSearch, $options: "i" } }, { eventState: { $regex: escapedSearch, $options: "i" } }, { contactPersonName: { $regex: escapedSearch, $options: "i" } }, { contactPersonPhone: { $regex: escapedSearch, $options: "i" } }, { instructions: { $regex: escapedSearch, $options: "i" } }, { note: { $regex: escapedSearch, $options: "i" } });
        // ✅ Search in lead fields (NOW AVAILABLE via $lookup!)
        searchConditions.push({ "leadData.fName": { $regex: escapedSearch, $options: "i" } }, { "leadData.lName": { $regex: escapedSearch, $options: "i" } }, { "leadData.cName": { $regex: escapedSearch, $options: "i" } }, { "leadData.email": { $regex: escapedSearch, $options: "i" } }, { "leadData.phone": { $regex: escapedSearch, $options: "i" } }, { "leadData.usageType": { $regex: escapedSearch, $options: "i" } });
        // Search numeric fields using $expr
        searchConditions.push({
            $expr: {
                $regexMatch: {
                    input: { $toString: "$quoteNo" },
                    regex: escapedSearch,
                    options: "i",
                },
            },
        }, {
            $expr: {
                $regexMatch: {
                    input: { $toString: "$leadNo" },
                    regex: escapedSearch,
                    options: "i",
                },
            },
        });
        // Search createdAt date field
        searchConditions.push({
            $expr: {
                $regexMatch: {
                    input: {
                        $dateToString: {
                            format: "%B %d, %Y, %H:%M",
                            date: "$createdAt",
                        },
                    },
                    regex: escapedSearch,
                    options: "i",
                },
            },
        });
    }
    // Step 5: Combine search and column filters
    const matchConditions = [];
    // Add global search conditions (only if search was provided)
    if (searchConditions.length > 0) {
        matchConditions.push({ $or: searchConditions });
    }
    // Add column filter conditions
    if (Object.keys(columnFilterConditions).length > 0) {
        Object.keys(columnFilterConditions).forEach((key) => {
            matchConditions.push({ [key]: columnFilterConditions[key] });
        });
    }
    // Add column filter $expr conditions
    if (columnFilterExpr.length > 0) {
        if (columnFilterExpr.length === 1) {
            matchConditions.push({ $expr: columnFilterExpr[0] });
        }
        else {
            matchConditions.push({ $expr: { $and: columnFilterExpr } });
        }
    }
    // Add $match stage if we have conditions
    if (matchConditions.length > 0) {
        if (matchConditions.length === 1) {
            pipeline.push({ $match: matchConditions[0] });
        }
        else {
            pipeline.push({ $match: { $and: matchConditions } });
        }
    }
    // Step 6: Count total documents (before pagination)
    const countPipeline = [...pipeline, { $count: "total" }];
    // Step 7: Sort
    const sortField = sortBy === "createdAt" ? "createdAt" : sortBy;
    pipeline.push({ $sort: { [sortField]: sortOrder === "desc" ? -1 : 1 } });
    // Step 8: Pagination
    pipeline.push({ $skip: skip }, { $limit: limit });
    // Step 9: Reshape result to match original structure
    pipeline.push({
        $addFields: {
            lead: "$leadData",
        },
    });
    pipeline.push({
        $project: {
            leadData: 0, // Remove temporary leadData field
        },
    });
    // Execute both pipelines
    const [results, countResult] = await Promise.all([
        Quotes.aggregate(pipeline),
        Quotes.aggregate(countPipeline),
    ]);
    const total = countResult[0]?.total || 0;
    return {
        data: results,
        pagination: {
            page,
            limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
export const getAllQuotes = async ({ page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "", ...columnFilters }) => {
    const skip = (page - 1) * limit;
    // Lead fields that require $lookup aggregation
    const leadFields = ["fName", "lName", "cName", "email", "phone", "usageType"];
    // Check if any lead field is being filtered
    const hasLeadFieldFilter = Object.keys(columnFilters).some((key) => leadFields.includes(key) && columnFilters[key]);
    // If global search OR lead field filtering is requested, use aggregation with $lookup
    if ((search && search.trim()) || hasLeadFieldFilter) {
        return await getAllQuotesWithAggregation({
            page,
            limit,
            sortBy,
            sortOrder,
            search: search ? search.trim() : "",
            columnFilters,
        });
    }
    // Otherwise, use regular query for column filters only (faster for non-lead fields)
    let query = {};
    const exprConditions = []; // Collect $expr conditions for numeric field regex searches
    // Handle column-specific filters
    // NOTE: Only include fields that exist directly on the quotes collection
    const allowedColumnFilters = [
        "quoteNo",
        "leadNo",
        "emailStatus",
        "deliveryDate",
        "pickupDate",
        "contactPersonName",
        "contactPersonPhone",
        "instructions",
        "note",
        "createdAt",
    ];
    Object.keys(columnFilters).forEach((key) => {
        if (allowedColumnFilters.includes(key) && columnFilters[key]) {
            const filterValue = String(columnFilters[key]).trim();
            if (filterValue) {
                // For date fields, try to parse with multiple formats
                if (key === "createdAt" ||
                    key === "deliveryDate" ||
                    key === "pickupDate") {
                    try {
                        // Only use exact date matching if the input includes a year (4 digits)
                        const hasYear = /\d{4}/.test(filterValue);
                        let parsedDate = null;
                        if (hasYear) {
                            const dateFormats = [
                                "MMMM D, YYYY",
                                "MMMM D YYYY",
                                "MMM D, YYYY",
                                "MMM D YYYY",
                                "MM/DD/YYYY",
                                "MM-DD-YYYY",
                                "YYYY-MM-DD",
                                "M/D/YYYY",
                                "M-D-YYYY",
                                "D MMMM YYYY",
                                "D MMM YYYY",
                            ];
                            for (const format of dateFormats) {
                                const testDate = dayjs(filterValue, format, true);
                                if (testDate.isValid()) {
                                    parsedDate = testDate;
                                    break;
                                }
                            }
                            if (!parsedDate || !parsedDate.isValid()) {
                                const standardDate = new Date(filterValue);
                                if (!isNaN(standardDate.getTime())) {
                                    parsedDate = dayjs(standardDate);
                                }
                            }
                        }
                        if (parsedDate && parsedDate.isValid() && hasYear) {
                            // Exact date range matching (only when year is specified)
                            const startOfDay = parsedDate.startOf("day").toDate();
                            const endOfDay = parsedDate.endOf("day").toDate();
                            query[key] = { $gte: startOfDay, $lte: endOfDay };
                        }
                        else {
                            // For createdAt (Date field), use $expr with $dateToString for partial matching
                            // For deliveryDate/pickupDate (String fields), use regex
                            if (key === "createdAt") {
                                // Use $expr to convert Date to formatted string for partial matching
                                const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                exprConditions.push({
                                    $regexMatch: {
                                        input: {
                                            $dateToString: {
                                                format: "%B %d, %Y, %H:%M",
                                                date: `$${key}`,
                                            },
                                        },
                                        regex: escapedValue,
                                        options: "i",
                                    },
                                });
                            }
                            else {
                                // Fallback to regex search for String date fields (deliveryDate, pickupDate)
                                const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                query[key] = { $regex: escapedValue, $options: "i" };
                            }
                        }
                    }
                    catch {
                        // For createdAt (Date field), use $expr with $dateToString for partial matching
                        // For deliveryDate/pickupDate (String fields), use regex
                        if (key === "createdAt") {
                            // Use $expr to convert Date to formatted string for partial matching
                            const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            exprConditions.push({
                                $regexMatch: {
                                    input: {
                                        $dateToString: {
                                            format: "%B %d, %Y, %H:%M",
                                            date: `$${key}`,
                                        },
                                    },
                                    regex: escapedValue,
                                    options: "i",
                                },
                            });
                        }
                        else {
                            // Fallback to regex search for String date fields (deliveryDate, pickupDate)
                            const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            query[key] = { $regex: escapedValue, $options: "i" };
                        }
                    }
                }
                else if (key === "quoteNo" || key === "leadNo") {
                    // Check if the filter value is a valid number (exact match)
                    const numericValue = Number.isFinite(Number(filterValue)) &&
                        !isNaN(Number(filterValue)) &&
                        String(Number(filterValue)) === filterValue.trim()
                        ? Number(filterValue)
                        : null;
                    if (numericValue !== null) {
                        // Exact numeric match
                        query[key] = numericValue;
                    }
                    else {
                        // For non-numeric or partial matches, convert number to string for regex search
                        // Use $expr to convert the number field to string for regex matching
                        const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        exprConditions.push({
                            $regexMatch: {
                                input: { $toString: `$${key}` },
                                regex: escapedValue,
                                options: "i",
                            },
                        });
                    }
                }
                else {
                    // For all other text fields, use regex search (supports partial matching)
                    const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    query[key] = { $regex: escapedValue, $options: "i" };
                }
            }
        }
    });
    // Combine $expr conditions if any exist
    if (exprConditions.length > 0) {
        if (exprConditions.length === 1) {
            query.$expr = exprConditions[0];
        }
        else {
            query.$expr = { $and: exprConditions };
        }
    }
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const [quotes, total] = await Promise.all([
        quotesRepository.findAll({ query, sort, skip, limit }),
        quotesRepository.count(query),
    ]);
    // ✅ OPTIMIZED: Batch fetch leads instead of N+1 queries
    const quotesNeedingLeads = quotes.filter((quote) => !quote.lead && quote.leadNo);
    let leadsMap = new Map();
    if (quotesNeedingLeads.length > 0) {
        const Leads = (await import("../../leads/models/Leads.js")).default;
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
        const Leads = (await import("../../leads/models/Leads.js")).default;
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
    if (updateData.usageType !== undefined &&
        (!updateData.usageType ||
            updateData.usageType.trim() === "" ||
            updateData.usageType === "None")) {
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
        const Leads = (await import("../../leads/models/Leads.js")).default;
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
    Object.keys(leadFields).forEach((key) => leadFields[key] === undefined && delete leadFields[key]);
    // ✅ Update the associated Lead if it exists and there are lead fields to update
    if (leadId && Object.keys(leadFields).length > 0) {
        const Leads = (await import("../../leads/models/Leads.js")).default;
        await Leads.findByIdAndUpdate(leadId, { $set: leadFields }, { new: true, runValidators: true });
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
    Object.keys(quoteFields).forEach((key) => quoteFields[key] === undefined && delete quoteFields[key]);
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
    const SalesOrder = (await import("../../salesOrders/models/SalesOrders.js")).default;
    const salesOrdersCount = await SalesOrder.countDocuments({
        $or: [{ quote: id }, { quoteNo: existingQuote.quoteNo }],
    });
    if (salesOrdersCount > 0) {
        const error = new Error(`Cannot delete quote. Related records exist: ${salesOrdersCount} sales order(s). ` +
            `Please delete these records first or contact an administrator.`);
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
//# sourceMappingURL=quotesService.js.map