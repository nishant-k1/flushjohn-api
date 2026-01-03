/**
 * Vendors Service - Business Logic Layer
 */

import * as vendorsRepository from "../repositories/vendorsRepository.js";
import { getCurrentDateTime, dayjs } from "../../../lib/dayjs.js";

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const generateVendorNumber = async () => {
  const latestVendor = await vendorsRepository.findOne({}, "vendorNo");
  const latestVendorNo = latestVendor ? latestVendor.vendorNo : 999;
  return latestVendorNo + 1;
};

export const createVendor = async (vendorData) => {
  // Validate vendor name is required
  if (!vendorData.name || vendorData.name.trim() === "") {
    const error = new Error("Vendor name is required");
    error.name = "ValidationError";
    throw error;
  }

  if (vendorData.representatives && Array.isArray(vendorData.representatives)) {
    const vendorEmail = vendorData.email || "";
    const isEmailOptional = vendorEmail.trim() !== "";

    for (const rep of vendorData.representatives) {
      // Name is always required
      if (!rep.name || rep.name.trim() === "") {
        const error = new Error("Each representative must have a name");
        error.name = "ValidationError";
        throw error;
      }

      // Email is required only if vendor email doesn't exist
      if (!isEmailOptional && (!rep.email || rep.email.trim() === "")) {
        const error = new Error(
          "Each representative must have an email when vendor email is not provided"
        );
        error.name = "ValidationError";
        throw error;
      }

      // If email is provided, validate its format
      if (rep.email && rep.email.trim() !== "") {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(rep.email)) {
          const error = new Error("Invalid email format for representative");
          error.name = "ValidationError";
          throw error;
        }
      }
    }
  }

  const createdAt = getCurrentDateTime();
  const vendorNo = await generateVendorNumber();

  const newVendorData = {
    ...vendorData,
    createdAt,
    vendorNo,
  };

  return await vendorsRepository.create(newVendorData);
};

export const getAllVendors = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  search = "",
  ...columnFilters
}) => {
  const skip = (page - 1) * limit;

  let query = {};

  // Handle column-specific filters
  const allowedColumnFilters = [
    "name",
    "cName",
    "email",
    "phone",
    "fax",
    "streetAddress",
    "city",
    "state",
    "zip",
    "country",
    "serviceCities",
    "serviceStates",
    "serviceZipCodes",
    "note",
    "vendorNo",
    "createdAt",
  ];

  const exprConditions = []; // Collect $expr conditions for numeric/date field regex searches

  Object.keys(columnFilters).forEach((key) => {
    if (allowedColumnFilters.includes(key) && columnFilters[key]) {
      const filterValue = String(columnFilters[key]).trim();
      if (filterValue) {
        // For date fields, try to parse with multiple formats
        if (key === "createdAt") {
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
            } else {
              // Use $expr to convert Date to formatted string for partial matching
              const escapedValue = filterValue.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
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
          } catch (e) {
            // Use $expr to convert Date to formatted string for partial matching
            const escapedValue = filterValue.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
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
        } else if (key === "vendorNo") {
          const numericValue = Number.isFinite(Number(filterValue))
            ? Number(filterValue)
            : null;
          if (numericValue !== null) {
            query[key] = numericValue;
          } else {
            const escapedValue = filterValue.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            exprConditions.push({
              $regexMatch: {
                input: { $toString: `$${key}` },
                regex: escapedValue,
                options: "i",
              },
            });
          }
        } else {
          // For all other text fields, use regex search (supports partial matching)
          const escapedValue = filterValue.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );
          query[key] = { $regex: escapedValue, $options: "i" };
        }
      }
    }
  });

  // Combine $expr conditions if any exist
  if (exprConditions.length > 0) {
    if (exprConditions.length === 1) {
      query.$expr = exprConditions[0];
    } else {
      query.$expr = { $and: exprConditions };
    }
  }
  if (search) {
    const normalizedSearch = String(search).trim();
    const safeSearch = escapeRegExp(normalizedSearch);

    const searchConditions = [
      // For numeric fields, use $expr with $toString for regex matching
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$vendorNo" },
            regex: safeSearch,
            options: "i",
          },
        },
      },
      { name: { $regex: safeSearch, $options: "i" } },
      { cName: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { phone: { $regex: safeSearch, $options: "i" } },
      { fax: { $regex: safeSearch, $options: "i" } },
      { streetAddress: { $regex: safeSearch, $options: "i" } },
      { city: { $regex: safeSearch, $options: "i" } },
      { state: { $regex: safeSearch, $options: "i" } },
      { zip: { $regex: safeSearch, $options: "i" } },
      { country: { $regex: safeSearch, $options: "i" } },
      { serviceCities: { $regex: safeSearch, $options: "i" } },
      { serviceStates: { $regex: safeSearch, $options: "i" } },
      { serviceZipCodes: { $regex: safeSearch, $options: "i" } },
      { note: { $regex: safeSearch, $options: "i" } },
      { "representatives.name": { $regex: safeSearch, $options: "i" } },
      { "representatives.email": { $regex: safeSearch, $options: "i" } },
      { "representatives.phone": { $regex: safeSearch, $options: "i" } },
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
            regex: safeSearch,
            options: "i",
          },
        },
      },
    ];

    query = {
      $or: searchConditions,
    };
  }

  const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [vendors, total] = await Promise.all([
    vendorsRepository.findAll({ query, sort, skip, limit }),
    vendorsRepository.count(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: vendors,
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

export const getVendorById = async (id) => {
  const vendor = await vendorsRepository.findById(id);

  if (!vendor) {
    const error = new Error("Vendor not found");
    error.name = "NotFoundError";
    throw error;
  }

  return vendor;
};

export const updateVendor = async (id, updateData) => {
  // Validate vendor name is required if it's being updated
  if (
    updateData.name !== undefined &&
    (!updateData.name || updateData.name.trim() === "")
  ) {
    const error = new Error("Vendor name is required");
    error.name = "ValidationError";
    throw error;
  }

  if (updateData.representatives && Array.isArray(updateData.representatives)) {
    // Get existing vendor to check if it has an email
    const existingVendor = await vendorsRepository.findById(id);
    const vendorEmail =
      updateData.email || (existingVendor && existingVendor.email) || "";
    const isEmailOptional = vendorEmail.trim() !== "";

    for (const rep of updateData.representatives) {
      // Name is always required
      if (!rep.name || rep.name.trim() === "") {
        const error = new Error("Each representative must have a name");
        error.name = "ValidationError";
        throw error;
      }

      // Email is required only if vendor email doesn't exist
      if (!isEmailOptional && (!rep.email || rep.email.trim() === "")) {
        const error = new Error(
          "Each representative must have an email when vendor email is not provided"
        );
        error.name = "ValidationError";
        throw error;
      }

      // If email is provided, validate its format
      if (rep.email && rep.email.trim() !== "") {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(rep.email)) {
          const error = new Error("Invalid email format for representative");
          error.name = "ValidationError";
          throw error;
        }
      }
    }
  }

  const vendor = await vendorsRepository.updateById(id, {
    ...updateData,
    updatedAt: getCurrentDateTime(),
  });

  if (!vendor) {
    const error = new Error("Vendor not found");
    error.name = "NotFoundError";
    throw error;
  }

  return vendor;
};

export const deleteVendor = async (id) => {
  const existingVendor = await vendorsRepository.findById(id);

  if (!existingVendor) {
    const error = new Error("Vendor not found");
    error.name = "NotFoundError";
    throw error;
  }

  await vendorsRepository.deleteById(id);
  return { _id: id };
};

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
