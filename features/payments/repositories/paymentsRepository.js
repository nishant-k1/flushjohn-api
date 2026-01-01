import Payments from "../models/Payments/index.js";

/**
 * Payments Repository
 * Database operations for Payments
 */
export const findAll = async ({
  query = {},
  sort = {},
  skip = 0,
  limit = 100,
}) => {
  return Payments.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("salesOrder customer")
    .lean();
};

export const findById = async (id) => {
  return Payments.findById(id).populate("salesOrder customer");
};

export const findOne = async (query, select = null) => {
  const queryBuilder = Payments.findOne(query);
  if (select) {
    return queryBuilder.select(select);
  }
  return queryBuilder;
};

export const create = async (data) => {
  const payment = new Payments(data);
  return payment.save();
};

export const updateById = async (id, updateData) => {
  return Payments.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
};

export const findOneAndUpdate = async (query, updateData) => {
  return Payments.findOneAndUpdate(
    query,
    { $set: updateData },
    { new: true, runValidators: true }
  );
};

export const deleteById = async (id) => {
  return Payments.findByIdAndDelete(id);
};

export const count = async (query = {}) => {
  return Payments.countDocuments(query);
};

export const findBySalesOrder = async (salesOrderId) => {
  return Payments.find({ salesOrder: salesOrderId })
    .sort({ createdAt: -1 })
    .populate("salesOrder customer");
};

export const findByStripePaymentIntentId = async (paymentIntentId) => {
  return Payments.findOne({ stripePaymentIntentId: paymentIntentId });
};

export const findByStripePaymentLinkId = async (paymentLinkId) => {
  return Payments.findOne({ stripePaymentLinkId: paymentLinkId });
};

export const findByStripeChargeId = async (chargeId) => {
  return Payments.findOne({ stripeChargeId: chargeId });
};
