/**
 * Customers Service - Business Logic Layer
 */
import * as customersRepository from "../repositories/customersRepository.js";
import { getCurrentDateTime, dayjs } from "../../../lib/dayjs.js";
export const generateCustomerNumber = async () => {
    const latestCustomer = await customersRepository.findOne({}, "customerNo");
    const latestCustomerNo = latestCustomer ? latestCustomer.customerNo : 999;
    return latestCustomerNo + 1;
};
export const createCustomer = async (customerData) => {
    const createdAt = getCurrentDateTime();
    const customerNo = await generateCustomerNumber();
    const newCustomerData = {
        ...customerData,
        createdAt,
        customerNo,
    };
    return await customersRepository.create(newCustomerData);
};
export const getAllCustomers = async ({ page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", search = "", ...columnFilters }) => {
    const skip = (page - 1) * limit;
    let query = {};
    // Handle column-specific filters (fName, lName, email, phone, zip, city, state, etc.)
    const allowedColumnFilters = [
        "fName",
        "lName",
        "email",
        "phone",
        "fax",
        "zip",
        "city",
        "state",
        "country",
        "customerNo",
        "cName",
        "streetAddress",
        "usageType",
        "instructions",
        "createdAt",
        "deliveryDate",
        "pickupDate",
    ];
    const exprConditions = []; // Collect $expr conditions for numeric/date field regex searches
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
                            const startOfDay = parsedDate.startOf("day").toDate();
                            const endOfDay = parsedDate.endOf("day").toDate();
                            query[key] = { $gte: startOfDay, $lte: endOfDay };
                        }
                        else {
                            // For createdAt (Date field), use $expr to convert to string for partial matching
                            // For deliveryDate/pickupDate (String fields), we can use regex
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
                                // Fallback to regex search for String date fields (deliveryDate, pickupDate)
                                const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                query[key] = { $regex: escapedValue, $options: "i" };
                            }
                        }
                    }
                    catch (e) {
                        // For createdAt (Date field), use $expr to convert to string for partial matching
                        // For deliveryDate/pickupDate (String fields), we can use regex
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
                            // Fallback to regex search for String date fields (deliveryDate, pickupDate)
                            const escapedValue = filterValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                            query[key] = { $regex: escapedValue, $options: "i" };
                        }
                    }
                }
                else if (key === "customerNo") {
                    const numericValue = Number.isFinite(Number(filterValue))
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
    if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchConditions = [
            { fName: { $regex: escapedSearch, $options: "i" } },
            { lName: { $regex: escapedSearch, $options: "i" } },
            { cName: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
            { phone: { $regex: escapedSearch, $options: "i" } },
            { fax: { $regex: escapedSearch, $options: "i" } },
            { streetAddress: { $regex: escapedSearch, $options: "i" } },
            { city: { $regex: escapedSearch, $options: "i" } },
            { state: { $regex: escapedSearch, $options: "i" } },
            { zip: { $regex: escapedSearch, $options: "i" } },
            { country: { $regex: escapedSearch, $options: "i" } },
            { deliveryDate: { $regex: escapedSearch, $options: "i" } },
            { pickupDate: { $regex: escapedSearch, $options: "i" } },
            { usageType: { $regex: escapedSearch, $options: "i" } },
            { instructions: { $regex: escapedSearch, $options: "i" } },
            // For numeric fields, use $expr with $toString for regex matching
            {
                $expr: {
                    $regexMatch: {
                        input: { $toString: "$customerNo" },
                        regex: escapedSearch,
                        options: "i",
                    },
                },
            },
            // For Date fields, convert to formatted string for partial matching
            {
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
            },
        ];
        query.$or = searchConditions;
    }
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const [customers, total] = await Promise.all([
        customersRepository.findAll({ query, sort, skip, limit }),
        customersRepository.count(query),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        data: customers,
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
export const getCustomerById = async (id) => {
    const customer = await customersRepository.findById(id);
    if (!customer) {
        const error = new Error("Customer not found");
        error.name = "NotFoundError";
        throw error;
    }
    return customer;
};
export const updateCustomer = async (id, updateData) => {
    const customer = await customersRepository.updateById(id, {
        ...updateData,
        updatedAt: getCurrentDateTime(),
    });
    if (!customer) {
        const error = new Error("Customer not found");
        error.name = "NotFoundError";
        throw error;
    }
    return customer;
};
export const deleteCustomer = async (id) => {
    const existingCustomer = await customersRepository.findById(id);
    if (!existingCustomer) {
        const error = new Error("Customer not found");
        error.name = "NotFoundError";
        throw error;
    }
    await customersRepository.deleteById(id);
    return { _id: id };
};
export const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
//# sourceMappingURL=customersService.js.map