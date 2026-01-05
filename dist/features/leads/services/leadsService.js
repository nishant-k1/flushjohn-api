/**
 * Leads Service - Business Logic Layer
 *
 * This layer contains all business logic for Leads.
 * It orchestrates repositories and handles business rules.
 */
import * as leadsRepository from "../repositories/leadsRepository.js";
import alertService from "../../common/services/alertService.js";
import { getCurrentDateTime } from "../../../lib/dayjs.js";
import { createLeadNotification } from "../../notifications/services/notificationHelpers.js";
import { deleteNotificationsByLeadId } from "../../notifications/services/notificationsService.js";
/**
 * Transform products based on lead source
 */
export const transformProductsData = (leadSource, products) => {
    if (!Array.isArray(products)) {
        return [];
    }
    const normalizedProducts = products.map((product, index) => {
        if (product.type && product.quantity !== undefined) {
            const qty = Number(product.quantity);
            const rate = Number(product.rate) || 0;
            const amount = Number(product.amount) || rate * qty;
            return {
                id: product.id || `legacy-${Date.now()}-${index}`,
                item: String(product.type || ""),
                desc: String(product.desc || product.type || ""),
                qty: qty,
                rate: rate,
                amount: amount,
            };
        }
        else {
            const qty = Number(product.qty);
            const rate = Number(product.rate) || 0;
            const amount = Number(product.amount) || rate * qty;
            return {
                id: product.id || `product-${Date.now()}-${index}`,
                item: String(product.item || ""),
                desc: String(product.desc || product.item || ""),
                qty: qty,
                rate: rate,
                amount: amount,
            };
        }
    });
    if (leadSource === "Web Lead" || leadSource === "Web Quick Lead") {
        return normalizedProducts.filter((product) => product.qty > 0);
    }
    return normalizedProducts;
};
/**
 * Prepare lead data for creation
 */
export const prepareLeadData = (leadData) => {
    const { leadSource, products, street, streetAddress, usageType, ...restArgs } = leadData;
    const actualLeadSource = leadSource || "Web Lead";
    let processedUsageType = usageType || "";
    if (usageType) {
        processedUsageType =
            usageType.charAt(0).toUpperCase() + usageType.slice(1).toLowerCase();
    }
    return {
        ...restArgs,
        leadSource: actualLeadSource,
        usageType: processedUsageType,
        products: transformProductsData(actualLeadSource, products),
        streetAddress: street || streetAddress || "", // Map 'street' to 'streetAddress'
    };
};
/**
 * Generate next lead number
 */
export const generateLeadNumber = async () => {
    const latestLead = await leadsRepository.findOne({}, "leadNo");
    const latestLeadNo = latestLead ? latestLead.leadNo : 999;
    return latestLeadNo + 1;
};
/**
 * Send lead alerts (non-blocking)
 */
export const sendLeadAlerts = async (lead, leadNo) => {
    try {
        const alertResults = await alertService.sendLeadAlerts(lead);
    }
    catch (alertError) { }
};
/**
 * Create a new lead
 */
export const createLead = async (leadData) => {
    if (!leadData.usageType ||
        leadData.usageType.trim() === "" ||
        leadData.usageType === "None") {
        const error = new Error("Usage type is required");
        error.name = "ValidationError";
        throw error;
    }
    const createdAt = getCurrentDateTime();
    const leadNo = await generateLeadNumber();
    const preparedData = prepareLeadData({ ...leadData, createdAt, leadNo });
    const lead = await leadsRepository.create(preparedData);
    sendLeadAlerts(lead, leadNo);
    // Create notifications for all active users (non-blocking)
    createLeadNotification(lead).catch((error) => {
        console.error("Error creating notifications:", error);
    });
    return lead;
};
/**
 * Get all leads with filters and pagination
 */
export const getAllLeads = async ({ page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", status, assignedTo, leadSource, search, hasCustomerNo, ...columnFilters }) => {
    const query = {};
    const exprConditions = [];
    const dayjs = (await import("../../../lib/dayjs.js")).dayjs;
    // Legacy filters
    if (status)
        query.leadStatus = status;
    if (assignedTo)
        query.assignedTo = assignedTo;
    if (leadSource)
        query.leadSource = leadSource;
    // Filter for leads that have been converted to customers
    // When hasCustomerNo is true, filter leads that have a customer reference
    if (hasCustomerNo === true || hasCustomerNo === "true") {
        query.customer = { $exists: true, $ne: null };
    }
    // Handle column-specific filters (all fields are in the leads collection)
    const allowedColumnFilters = [
        "leadNo",
        "fName",
        "lName",
        "cName",
        "email",
        "phone",
        "fax",
        "contactPersonName",
        "contactPersonPhone",
        "streetAddress",
        "city",
        "state",
        "zip",
        "country",
        "deliveryDate",
        "pickupDate",
        "usageType",
        "leadStatus",
        "leadSource",
        "assignedTo",
        "instructions",
        "createdAt",
    ];
    Object.keys(columnFilters).forEach((key) => {
        if (allowedColumnFilters.includes(key) && columnFilters[key]) {
            const filterValue = String(columnFilters[key]).trim();
            if (filterValue) {
                // For date fields
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
                        query[key] = { $gte: startOfDay, $lte: endOfDay };
                    }
                    else {
                        if (key === "createdAt") {
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
                            const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            query[key] = { $regex: escapedValue, $options: "i" };
                        }
                    }
                }
                else if (key === "leadNo") {
                    const numericValue = Number.isFinite(Number(filterValue)) &&
                        !isNaN(Number(filterValue)) &&
                        String(Number(filterValue)) === filterValue.trim()
                        ? Number(filterValue)
                        : null;
                    if (numericValue !== null) {
                        query[key] = numericValue;
                    }
                    else {
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
    // Handle global search
    if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchConditions = [
            { fName: { $regex: escapedSearch, $options: "i" } },
            { lName: { $regex: escapedSearch, $options: "i" } },
            { cName: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
            { phone: { $regex: escapedSearch, $options: "i" } },
            { fax: { $regex: escapedSearch, $options: "i" } },
            { contactPersonName: { $regex: escapedSearch, $options: "i" } },
            { contactPersonPhone: { $regex: escapedSearch, $options: "i" } },
            { streetAddress: { $regex: escapedSearch, $options: "i" } },
            { city: { $regex: escapedSearch, $options: "i" } },
            { state: { $regex: escapedSearch, $options: "i" } },
            { zip: { $regex: escapedSearch, $options: "i" } },
            { country: { $regex: escapedSearch, $options: "i" } },
            { deliveryDate: { $regex: escapedSearch, $options: "i" } },
            { pickupDate: { $regex: escapedSearch, $options: "i" } },
            { usageType: { $regex: escapedSearch, $options: "i" } },
            { leadStatus: { $regex: escapedSearch, $options: "i" } },
            { leadSource: { $regex: escapedSearch, $options: "i" } },
            { assignedTo: { $regex: escapedSearch, $options: "i" } },
            { instructions: { $regex: escapedSearch, $options: "i" } },
        ];
        // Search leadNo using $expr for partial numeric matching
        searchConditions.push({
            $expr: {
                $regexMatch: {
                    input: { $toString: "$leadNo" },
                    regex: escapedSearch,
                    options: "i",
                },
            },
        });
        // Search createdAt date field with partial matching
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
        // Combine search with existing filters
        const hasOtherFilters = Object.keys(query).some((key) => key !== "$or" && key !== "$and" && key !== "$expr");
        const hasExpr = query.$expr;
        if (hasOtherFilters || hasExpr) {
            const andConditions = [{ $or: searchConditions }];
            Object.keys(query).forEach((key) => {
                if (key !== "$or" && key !== "$and" && key !== "$expr") {
                    andConditions.push({ [key]: query[key] });
                }
            });
            if (hasExpr) {
                andConditions.push({ $expr: query.$expr });
            }
            query = { $and: andConditions };
        }
        else {
            query = { $or: searchConditions };
        }
    }
    const validSortFields = [
        "createdAt",
        "leadNo",
        "leadStatus",
        "assignedTo",
        "leadSource",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDirection };
    const skip = (page - 1) * limit;
    const [leadsList, totalCount] = await Promise.all([
        leadsRepository.findAll({ query, sort, skip, limit }),
        leadsRepository.count(query),
    ]);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
        data: leadsList,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
        },
        filters: {
            sortBy: sortField,
            sortOrder,
            status,
            assignedTo,
            leadSource,
            search,
        },
    };
};
/**
 * Get a single lead by ID
 */
export const getLeadById = async (id) => {
    const lead = await leadsRepository.findById(id);
    if (!lead) {
        const error = new Error("Lead not found");
        error.name = "NotFoundError";
        throw error;
    }
    return lead;
};
/**
 * Update a lead by ID
 */
export const updateLead = async (id, updateData) => {
    if (updateData.usageType !== undefined &&
        (!updateData.usageType ||
            updateData.usageType.trim() === "" ||
            updateData.usageType === "None")) {
        const error = new Error("Usage type is required");
        error.name = "ValidationError";
        throw error;
    }
    const lead = await leadsRepository.updateById(id, {
        ...updateData,
        updatedAt: getCurrentDateTime(),
    });
    if (!lead) {
        const error = new Error("Lead not found");
        error.name = "NotFoundError";
        throw error;
    }
    return lead;
};
/**
 * Delete a lead by ID
 */
export const deleteLead = async (id) => {
    const existingLead = await leadsRepository.findById(id);
    if (!existingLead) {
        const error = new Error("Lead not found");
        error.name = "NotFoundError";
        throw error;
    }
    // Check for related records
    const Quote = (await import("../../quotes/models/Quotes.js")).default;
    const SalesOrder = (await import("../../salesOrders/models/SalesOrders.js")).default;
    const JobOrder = (await import("../../jobOrders/models/JobOrders.js"))
        .default;
    const [quotesCount, salesOrdersCount, jobOrdersCount] = await Promise.all([
        Quote.countDocuments({
            $or: [{ lead: id }, { leadId: id }, { leadNo: existingLead.leadNo }],
        }),
        SalesOrder.countDocuments({
            $or: [{ lead: id }, { leadId: id }, { leadNo: existingLead.leadNo }],
        }),
        JobOrder.countDocuments({
            $or: [{ lead: id }, { leadId: id }, { leadNo: existingLead.leadNo }],
        }),
    ]);
    if (quotesCount > 0 || salesOrdersCount > 0 || jobOrdersCount > 0) {
        const relatedRecords = [];
        if (quotesCount > 0)
            relatedRecords.push(`${quotesCount} quote(s)`);
        if (salesOrdersCount > 0)
            relatedRecords.push(`${salesOrdersCount} sales order(s)`);
        if (jobOrdersCount > 0)
            relatedRecords.push(`${jobOrdersCount} job order(s)`);
        const error = new Error(`Cannot delete lead. Related records exist: ${relatedRecords.join(", ")}. ` + `Please delete these records first or contact an administrator.`);
        error.name = "DeletionBlockedError";
        error.details = { quotesCount, salesOrdersCount, jobOrdersCount };
        throw error;
    }
    await leadsRepository.deleteById(id);
    // Delete all notifications related to this lead (non-blocking)
    deleteNotificationsByLeadId(id).catch((error) => {
        console.error("Error deleting notifications for lead:", error);
    });
    return { _id: id };
};
/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (page, limit) => {
    const errors = [];
    if (page < 1) {
        errors.push("Page number must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
        errors.push("Limit must be between 1 and 100");
    }
    return errors;
};
//# sourceMappingURL=leadsService.js.map