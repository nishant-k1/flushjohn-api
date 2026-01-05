/**
 * Contacts Service - Business Logic Layer
 *
 * This layer contains all business logic for Contacts.
 * It orchestrates repositories and handles business rules.
 */

import * as contactsRepository from "../repositories/contactsRepository.js";

/**
 * Create a new contact
 */
export const createContact = async (contactData) => {
  const contact = await contactsRepository.create(contactData);
  return contact;
};

/**
 * Get all contacts with filters and pagination
 */
export const getAllContacts = async ({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  status,
  search,
  ...columnFilters
}) => {
  const query = {};
  const exprConditions = [];
  const dayjs = (await import("../../../lib/dayjs.js")).dayjs;

  // Legacy filter
  if (status) query.status = status;

  // Handle column-specific filters
  const allowedColumnFilters = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "message",
    "subject",
    "company",
    "status",
    "createdAt",
    "readAt",
    "repliedAt",
  ];

  Object.keys(columnFilters).forEach((key) => {
    if (allowedColumnFilters.includes(key) && columnFilters[key]) {
      const filterValue = String(columnFilters[key]).trim();
      if (filterValue) {
        // For date fields
        if (key === "createdAt" || key === "readAt" || key === "repliedAt") {
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
        } else {
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

  // Handle global search
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchConditions = [
      { firstName: { $regex: escapedSearch, $options: "i" } },
      { lastName: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { phone: { $regex: escapedSearch, $options: "i" } },
      { message: { $regex: escapedSearch, $options: "i" } },
      { subject: { $regex: escapedSearch, $options: "i" } },
      { company: { $regex: escapedSearch, $options: "i" } },
      { status: { $regex: escapedSearch, $options: "i" } },
    ];

    // Search date fields with partial matching
    searchConditions.push(
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
      {
        $expr: {
          $regexMatch: {
            input: {
              $dateToString: {
                format: "%B %d, %Y, %H:%M",
                date: "$readAt",
              },
            },
            regex: escapedSearch,
            options: "i",
          },
        },
      },
      {
        $expr: {
          $regexMatch: {
            input: {
              $dateToString: {
                format: "%B %d, %Y, %H:%M",
                date: "$repliedAt",
              },
            },
            regex: escapedSearch,
            options: "i",
          },
        },
      }
    );

    // Combine search with existing filters
    const hasOtherFilters = Object.keys(query).some(
      (key) => key !== "$or" && key !== "$and" && key !== "$expr"
    );
    const hasExpr = (query as any).$expr;

    if (hasOtherFilters || hasExpr) {
      const andConditions = [{ $or: searchConditions }];

      Object.keys(query).forEach((key) => {
        if (key !== "$or" && key !== "$and" && key !== "$expr") {
          andConditions.push({ [key]: query[key] });
        }
      });

      if (hasExpr) {
        andConditions.push({ $expr: (query as any).$expr });
      }

      query = { $and: andConditions };
    } else {
      query = { $or: searchConditions };
    }
  }

  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    contactsRepository.findAll({ query, sort, skip, limit }),
    contactsRepository.count(query),
  ]);

  return {
    data: contacts,
    pagination: {
      currentPage: page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a contact by ID
 */
export const getContactById = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid contact ID format");
    error.name = "CastError";
    throw error;
  }

  const contact = await contactsRepository.findById(id);

  if (!contact) {
    const error = new Error(`Contact with ID ${id} not found`);
    error.name = "NotFoundError";
    throw error;
  }

  return contact;
};

/**
 * Update a contact by ID
 */
export const updateContact = async (id, updateData) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid contact ID format");
    error.name = "CastError";
    throw error;
  }

  const contact = await contactsRepository.findById(id);

  if (!contact) {
    const error = new Error(`Contact with ID ${id} not found`);
    error.name = "NotFoundError";
    throw error;
  }

  // Update readAt when status changes to Read
  if (updateData.status === "Read" && contact.status !== "Read") {
    updateData.readAt = new Date();
  }

  // Update repliedAt when status changes to Replied
  if (updateData.status === "Replied" && contact.status !== "Replied") {
    updateData.repliedAt = new Date();
  }

  const updatedContact = await contactsRepository.updateById(id, updateData);
  return updatedContact;
};

/**
 * Delete a contact by ID
 */
export const deleteContact = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error("Invalid contact ID format");
    error.name = "CastError";
    throw error;
  }

  const contact = await contactsRepository.findById(id);

  if (!contact) {
    const error = new Error(`Contact with ID ${id} not found`);
    error.name = "NotFoundError";
    throw error;
  }

  await contactsRepository.deleteById(id);
  return { message: "Contact deleted successfully" };
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

/**
 * Check if string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

