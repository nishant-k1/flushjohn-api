/**
 * Vendors Service - Business Logic Layer
 */

import * as vendorsRepository from "../repositories/vendorsRepository.js";
import { getCurrentDateTime } from "../../../lib/dayjs/index.js";

export const generateVendorNumber = async () => {
  const latestVendor = await vendorsRepository.findOne({}, "vendorNo");
  const latestVendorNo = latestVendor ? latestVendor.vendorNo : 999;
  return latestVendorNo + 1;
};

export const createVendor = async (vendorData) => {
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
}) => {
  const skip = (page - 1) * limit;

  let query = {};
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { cName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { repNames: { $regex: search, $options: "i" } },
      ],
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
