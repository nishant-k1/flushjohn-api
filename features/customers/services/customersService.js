/**
 * Customers Service - Business Logic Layer
 */

import * as customersRepository from "../repositories/customersRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

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

export const getAllCustomers = async ({
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
    ];

    // Search customerNo if search term is numeric
    const numericSearch = Number.isFinite(Number(search)) ? Number(search) : null;
    if (numericSearch !== null) {
      searchConditions.push({ customerNo: numericSearch });
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
