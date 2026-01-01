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
}) => {
  const query = {};

  if (status) query.status = status;

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

    // Try to parse as date and search createdAt, readAt, repliedAt
    try {
      const searchDate = new Date(search);
      if (!isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);
        searchConditions.push(
          {
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
          {
            readAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
          {
            repliedAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          }
        );
      }
    } catch (e) {
      // Ignore date parsing errors
    }

    query.$or = searchConditions;
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

