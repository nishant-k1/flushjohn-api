/**
 * Price Calculation Utilities
 * MONEY/CURRENCY OPERATIONS ONLY
 * 
 * This file contains utilities specifically for financial/price calculations.
 * All functions here handle money with proper rounding and validation.
 * 
 * For general numeric operations (counts, percentages, scores, etc.),
 * use numericCalculations.ts instead.
 */

import { roundToDecimals, round } from "./numericCalculations.js";

const MAX_PRICE = 1_000_000_000; // $1 billion
const MAX_CENTS = 1_000_000_000_000; // 1 trillion cents

/**
 * Round a price value to 2 decimal places
 * FOR MONEY ONLY - Validates positive values and max limits
 * @param value - Price value (number or string)
 * @returns Rounded price as number
 * @throws Error if value is invalid
 */
export const roundPrice = (value: number | string): number => {
  const numValue = parseFloat(String(value));

  if (isNaN(numValue) || !Number.isFinite(numValue)) {
    throw new Error(
      `Invalid price value: ${value}. Value must be a valid finite number.`
    );
  }

  if (numValue < 0) {
    throw new Error(`Invalid price value: ${value}. Price must be >= 0.`);
  }

  if (Math.abs(numValue) > MAX_PRICE) {
    throw new Error(`Price ${value} exceeds maximum allowed (${MAX_PRICE})`);
  }

  return roundToDecimals(numValue, 2);
};

/**
 * Convert dollars to cents (for Stripe API and other services)
 * @param amount - Amount in dollars (number or string)
 * @returns Amount in cents (integer)
 * @throws Error if amount is invalid
 */
export const dollarsToCents = (amount: number | string): number => {
  const amountNum = parseFloat(String(amount));

  if (isNaN(amountNum) || !Number.isFinite(amountNum)) {
    throw new Error(
      `Invalid amount: ${amount}. Amount must be a valid finite number.`
    );
  }

  if (amountNum < 0) {
    throw new Error(`Invalid amount: ${amount}. Amount cannot be negative.`);
  }

  const cents = round(amountNum * 100);

  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error(`Conversion resulted in invalid value. amount: ${amount}`);
  }

  if (cents > MAX_CENTS) {
    throw new Error(
      `Amount in cents exceeds maximum allowed (${MAX_CENTS} cents)`
    );
  }

  return cents;
};

/**
 * Convert cents to dollars
 * @param cents - Amount in cents (integer)
 * @returns Amount in dollars as formatted string (e.g., "99.99")
 * @throws Error if cents is invalid
 */
export const centsToDollars = (cents: number): string => {
  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error(
      `Invalid cents value: ${cents}. Cents must be a valid non-negative integer.`
    );
  }

  return (cents / 100).toFixed(2);
};

/**
 * Calculate percentage of an amount
 * @param amount - Base amount (number or string)
 * @param percentage - Percentage value (e.g., 8.5 for 8.5%)
 * @returns Percentage amount as number
 * @throws Error if inputs are invalid
 */
export const calculatePercentage = (
  amount: number | string,
  percentage: number | string
): number => {
  const amountNum = parseFloat(String(amount));
  const percentageNum = parseFloat(String(percentage));

  if (isNaN(amountNum) || !Number.isFinite(amountNum)) {
    throw new Error(
      `Invalid amount: ${amount}. Amount must be a valid finite number.`
    );
  }

  if (isNaN(percentageNum) || !Number.isFinite(percentageNum)) {
    throw new Error(
      `Invalid percentage: ${percentage}. Percentage must be a valid finite number.`
    );
  }

  if (amountNum < 0) {
    throw new Error(`Invalid amount: ${amount}. Amount must be >= 0.`);
  }

  if (percentageNum < 0 || percentageNum > 100) {
    throw new Error(
      `Invalid percentage: ${percentage}. Percentage must be between 0 and 100.`
    );
  }

  const result = divide(multiply(amountNum, percentageNum), 100);

  if (!Number.isFinite(result) || result < 0) {
    throw new Error(
      `Percentage calculation resulted in invalid value. amount: ${amount}, percentage: ${percentage}`
    );
  }

  return roundPrice(result);
};

/**
 * Calculate price with margin added
 * @param basePrice - Base price (number or string)
 * @param marginAmount - Margin amount to add (number or string)
 * @returns Price with margin as number
 * @throws Error if inputs are invalid
 */
export const addMargin = (
  basePrice: number | string,
  marginAmount: number | string
): number => {
  const basePriceNum = parseFloat(String(basePrice));
  const marginNum = parseFloat(String(marginAmount));

  if (isNaN(basePriceNum) || !Number.isFinite(basePriceNum)) {
    throw new Error(
      `Invalid base price: ${basePrice}. Base price must be a valid finite number.`
    );
  }

  if (isNaN(marginNum) || !Number.isFinite(marginNum)) {
    throw new Error(
      `Invalid margin amount: ${marginAmount}. Margin must be a valid finite number.`
    );
  }

  if (basePriceNum < 0) {
    throw new Error(
      `Invalid base price: ${basePrice}. Base price must be >= 0.`
    );
  }

  const result = add(basePriceNum, marginNum);

  if (!Number.isFinite(result) || result < 0) {
    throw new Error(
      `Margin calculation resulted in invalid value. basePrice: ${basePrice}, marginAmount: ${marginAmount}`
    );
  }

  return roundPrice(result);
};

/**
 * Calculate price with multiplier applied
 * @param basePrice - Base price (number or string)
 * @param multiplier - Multiplier value (e.g., 1.2 for 20% increase)
 * @returns Price with multiplier applied as number
 * @throws Error if inputs are invalid
 */
export const applyMultiplier = (
  basePrice: number | string,
  multiplier: number | string
): number => {
  const basePriceNum = parseFloat(String(basePrice));
  const multiplierNum = parseFloat(String(multiplier));

  if (isNaN(basePriceNum) || !Number.isFinite(basePriceNum)) {
    throw new Error(
      `Invalid base price: ${basePrice}. Base price must be a valid finite number.`
    );
  }

  if (isNaN(multiplierNum) || !Number.isFinite(multiplierNum)) {
    throw new Error(
      `Invalid multiplier: ${multiplier}. Multiplier must be a valid finite number.`
    );
  }

  if (basePriceNum < 0) {
    throw new Error(
      `Invalid base price: ${basePrice}. Base price must be >= 0.`
    );
  }

  if (multiplierNum < 0) {
    throw new Error(
      `Invalid multiplier: ${multiplier}. Multiplier must be >= 0.`
    );
  }

  const result = multiply(basePriceNum, multiplierNum);

  if (!Number.isFinite(result) || result < 0) {
    throw new Error(
      `Multiplier calculation resulted in invalid value. basePrice: ${basePrice}, multiplier: ${multiplier}`
    );
  }

  return roundPrice(result);
};

/**
 * Calculate balance due (order total minus paid amount)
 * @param orderTotal - Order total amount (number or string)
 * @param paidAmount - Amount already paid (number or string)
 * @returns Balance due as number (minimum 0)
 * @throws Error if inputs are invalid
 */
export const calculateBalanceDue = (
  orderTotal: number | string,
  paidAmount: number | string
): number => {
  const orderTotalNum = parseFloat(String(orderTotal));
  const paidAmountNum = parseFloat(String(paidAmount));

  if (isNaN(orderTotalNum) || !Number.isFinite(orderTotalNum)) {
    throw new Error(
      `Invalid order total: ${orderTotal}. Order total must be a valid finite number.`
    );
  }

  if (isNaN(paidAmountNum) || !Number.isFinite(paidAmountNum)) {
    throw new Error(
      `Invalid paid amount: ${paidAmount}. Paid amount must be a valid finite number.`
    );
  }

  if (orderTotalNum < 0) {
    throw new Error(
      `Invalid order total: ${orderTotal}. Order total must be >= 0.`
    );
  }

  if (paidAmountNum < 0) {
    throw new Error(
      `Invalid paid amount: ${paidAmount}. Paid amount must be >= 0.`
    );
  }

  const balanceDue = subtract(orderTotalNum, paidAmountNum);
  return max(0, balanceDue);
};

/**
 * Calculate net paid amount (total paid minus refunds)
 * @param totalPaid - Total amount paid (number or string)
 * @param totalRefunded - Total amount refunded (number or string)
 * @returns Net paid amount as number (minimum 0)
 * @throws Error if inputs are invalid
 */
export const calculateNetPaidAmount = (
  totalPaid: number | string,
  totalRefunded: number | string
): number => {
  const totalPaidNum = parseFloat(String(totalPaid));
  const totalRefundedNum = parseFloat(String(totalRefunded));

  if (isNaN(totalPaidNum) || !Number.isFinite(totalPaidNum)) {
    throw new Error(
      `Invalid total paid: ${totalPaid}. Total paid must be a valid finite number.`
    );
  }

  if (isNaN(totalRefundedNum) || !Number.isFinite(totalRefundedNum)) {
    throw new Error(
      `Invalid total refunded: ${totalRefunded}. Total refunded must be a valid finite number.`
    );
  }

  if (totalPaidNum < 0) {
    throw new Error(
      `Invalid total paid: ${totalPaid}. Total paid must be >= 0.`
    );
  }

  if (totalRefundedNum < 0) {
    throw new Error(
      `Invalid total refunded: ${totalRefunded}. Total refunded must be >= 0.`
    );
  }

  const netPaid = subtract(totalPaidNum, totalRefundedNum);
  return max(0, netPaid);
};

/**
 * Calculate available refund amount
 * @param paymentAmount - Original payment amount (number or string)
 * @param refundedAmount - Amount already refunded (number or string)
 * @returns Available refund amount as number
 * @throws Error if inputs are invalid
 */
export const calculateAvailableRefund = (
  paymentAmount: number | string,
  refundedAmount: number | string = 0
): number => {
  const paymentAmountNum = parseFloat(String(paymentAmount));
  const refundedAmountNum = parseFloat(String(refundedAmount));

  if (isNaN(paymentAmountNum) || !Number.isFinite(paymentAmountNum)) {
    throw new Error(
      `Invalid payment amount: ${paymentAmount}. Payment amount must be a valid finite number.`
    );
  }

  if (isNaN(refundedAmountNum) || !Number.isFinite(refundedAmountNum)) {
    throw new Error(
      `Invalid refunded amount: ${refundedAmount}. Refunded amount must be a valid finite number.`
    );
  }

  if (paymentAmountNum < 0) {
    throw new Error(
      `Invalid payment amount: ${paymentAmount}. Payment amount must be >= 0.`
    );
  }

  if (refundedAmountNum < 0) {
    throw new Error(
      `Invalid refunded amount: ${refundedAmount}. Refunded amount must be >= 0.`
    );
  }

  if (refundedAmountNum > paymentAmountNum) {
    throw new Error(
      `Refunded amount (${refundedAmount}) cannot exceed payment amount (${paymentAmount})`
    );
  }

  return subtract(paymentAmountNum, refundedAmountNum);
};

/**
 * Calculate order revenue (sales order amount minus job order amount plus vendor charges)
 * @param salesOrderAmount - Sales order total amount (number or string)
 * @param totalJobOrderAmount - Total job order amount (number or string)
 * @param vendorCharges - Vendor transaction charges (number or string)
 * @returns Order revenue as number
 * @throws Error if inputs are invalid
 */
export const calculateOrderRevenue = (
  salesOrderAmount: number | string,
  totalJobOrderAmount: number | string,
  vendorCharges: number | string = 0
): number => {
  const salesOrderAmountNum = parseFloat(String(salesOrderAmount));
  const totalJobOrderAmountNum = parseFloat(String(totalJobOrderAmount));
  const vendorChargesNum = parseFloat(String(vendorCharges));

  if (isNaN(salesOrderAmountNum) || !Number.isFinite(salesOrderAmountNum)) {
    throw new Error(
      `Invalid sales order amount: ${salesOrderAmount}. Sales order amount must be a valid finite number.`
    );
  }

  if (
    isNaN(totalJobOrderAmountNum) ||
    !Number.isFinite(totalJobOrderAmountNum)
  ) {
    throw new Error(
      `Invalid job order amount: ${totalJobOrderAmount}. Job order amount must be a valid finite number.`
    );
  }

  if (isNaN(vendorChargesNum) || !Number.isFinite(vendorChargesNum)) {
    throw new Error(
      `Invalid vendor charges: ${vendorCharges}. Vendor charges must be a valid finite number.`
    );
  }

  if (salesOrderAmountNum < 0) {
    throw new Error(
      `Invalid sales order amount: ${salesOrderAmount}. Sales order amount must be >= 0.`
    );
  }

  if (totalJobOrderAmountNum < 0) {
    throw new Error(
      `Invalid job order amount: ${totalJobOrderAmount}. Job order amount must be >= 0.`
    );
  }

  const revenue = add(
    subtract(salesOrderAmountNum, totalJobOrderAmountNum),
    vendorChargesNum
  );

  if (!Number.isFinite(revenue)) {
    throw new Error(
      `Revenue calculation resulted in invalid value. salesOrderAmount: ${salesOrderAmount}, totalJobOrderAmount: ${totalJobOrderAmount}, vendorCharges: ${vendorCharges}`
    );
  }

  return revenue;
};

/**
 * Calculate percentage difference between two prices
 * @param originalPrice - Original price (number or string)
 * @param newPrice - New price (number or string)
 * @returns Percentage difference as number (can be negative)
 * @throws Error if inputs are invalid
 */
export const calculatePriceDifferencePercentage = (
  originalPrice: number | string,
  newPrice: number | string
): number => {
  const originalPriceNum = parseFloat(String(originalPrice));
  const newPriceNum = parseFloat(String(newPrice));

  if (isNaN(originalPriceNum) || !Number.isFinite(originalPriceNum)) {
    throw new Error(
      `Invalid original price: ${originalPrice}. Original price must be a valid finite number.`
    );
  }

  if (isNaN(newPriceNum) || !Number.isFinite(newPriceNum)) {
    throw new Error(
      `Invalid new price: ${newPrice}. New price must be a valid finite number.`
    );
  }

  if (originalPriceNum <= 0) {
    throw new Error(
      `Invalid original price: ${originalPrice}. Original price must be > 0.`
    );
  }

  const priceDifference = subtract(newPriceNum, originalPriceNum);
  const percentageDifference = multiply(
    divide(priceDifference, originalPriceNum),
    100
  );

  if (!Number.isFinite(percentageDifference)) {
    throw new Error(
      `Percentage difference calculation resulted in invalid value. originalPrice: ${originalPrice}, newPrice: ${newPrice}`
    );
  }

  return roundPrice(percentageDifference);
};

/**
 * Calculate accuracy rating based on price difference
 * @param originalPrice - Original/suggested price (number or string)
 * @param actualPrice - Actual price (number or string)
 * @returns Accuracy rating as number (0-100, where 100 is perfect match)
 * @throws Error if inputs are invalid
 */
export const calculateAccuracyRating = (
  originalPrice: number | string,
  actualPrice: number | string
): number => {
  const percentageDifference = abs(
    calculatePriceDifferencePercentage(originalPrice, actualPrice)
  );
  const accuracyRating = max(0, subtract(100, percentageDifference));
  return accuracyRating;
};

/**
 * Add two monetary values (FOR MONEY ONLY)
 * Automatically rounds to 2 decimal places with proper precision
 * @param a - First monetary value
 * @param b - Second monetary value
 * @returns Sum as number (rounded to 2 decimals)
 * @throws Error if inputs are invalid or result is negative
 */
export const add = (a: number | string, b: number | string): number => {
  const aNum = parseFloat(String(a));
  const bNum = parseFloat(String(b));

  if (isNaN(aNum) || !Number.isFinite(aNum)) {
    throw new Error(
      `Invalid value: ${a}. Value must be a valid finite number.`
    );
  }

  if (isNaN(bNum) || !Number.isFinite(bNum)) {
    throw new Error(
      `Invalid value: ${b}. Value must be a valid finite number.`
    );
  }

  const result = aNum + bNum;
  
  // For addition, use roundToDecimals to avoid negative validation issues
  // roundPrice would fail if intermediate calculations produce tiny negatives
  if (result < 0) {
    throw new Error(
      `Price addition resulted in negative value: ${a} + ${b} = ${result}`
    );
  }
  
  return roundToDecimals(result, 2);
};

/**
 * Subtract two monetary values (FOR MONEY ONLY)
 * Can produce negative results (e.g., overpayment, refunds)
 * Rounds to 2 decimal places without strict positive validation
 * @param a - First monetary value (minuend)
 * @param b - Second monetary value (subtrahend)
 * @returns Difference as number (can be negative, rounded to 2 decimals)
 * @throws Error if inputs are invalid
 */
export const subtract = (a: number | string, b: number | string): number => {
  const aNum = parseFloat(String(a));
  const bNum = parseFloat(String(b));

  if (isNaN(aNum) || !Number.isFinite(aNum)) {
    throw new Error(
      `Invalid value: ${a}. Value must be a valid finite number.`
    );
  }

  if (isNaN(bNum) || !Number.isFinite(bNum)) {
    throw new Error(
      `Invalid value: ${b}. Value must be a valid finite number.`
    );
  }

  const result = aNum - bNum;
  
  // Use roundToDecimals instead of roundPrice to allow negative values
  // (e.g., when calculating overpayment: paid - total can be negative)
  return roundToDecimals(result, 2);
};

/**
 * Multiply two values for monetary calculations (FOR MONEY ONLY)
 * @param a - First value (e.g., quantity, rate, multiplier)
 * @param b - Second value (e.g., price, rate)
 * @returns Product as number (rounded to 2 decimals)
 * @throws Error if inputs are invalid or result is negative
 */
export const multiply = (a: number | string, b: number | string): number => {
  const aNum = parseFloat(String(a));
  const bNum = parseFloat(String(b));

  if (isNaN(aNum) || !Number.isFinite(aNum)) {
    throw new Error(
      `Invalid value: ${a}. Value must be a valid finite number.`
    );
  }

  if (isNaN(bNum) || !Number.isFinite(bNum)) {
    throw new Error(
      `Invalid value: ${b}. Value must be a valid finite number.`
    );
  }

  const result = aNum * bNum;
  
  if (result < 0) {
    throw new Error(
      `Price multiplication resulted in negative value: ${a} * ${b} = ${result}`
    );
  }
  
  return roundToDecimals(result, 2);
};

/**
 * Divide two values for monetary calculations (FOR MONEY ONLY)
 * @param a - Numerator (dividend)
 * @param b - Denominator (divisor)
 * @returns Quotient as number (rounded to 2 decimals)
 * @throws Error if inputs are invalid, division by zero, or result is negative
 */
export const divide = (a: number | string, b: number | string): number => {
  const aNum = parseFloat(String(a));
  const bNum = parseFloat(String(b));

  if (isNaN(aNum) || !Number.isFinite(aNum)) {
    throw new Error(
      `Invalid value: ${a}. Value must be a valid finite number.`
    );
  }

  if (isNaN(bNum) || !Number.isFinite(bNum)) {
    throw new Error(
      `Invalid value: ${b}. Value must be a valid finite number.`
    );
  }

  if (bNum === 0) {
    throw new Error("Division by zero is not allowed.");
  }

  const result = aNum / bNum;
  
  if (result < 0) {
    throw new Error(
      `Price division resulted in negative value: ${a} / ${b} = ${result}`
    );
  }
  
  return roundToDecimals(result, 2);
};

/**
 * Get the maximum of two numbers (for price calculations)
 * @param a - First number
 * @param b - Second number
 * @returns Maximum value as number
 * @throws Error if inputs are invalid
 */
export const max = (a: number | string, b: number | string): number => {
  const aNum = parseFloat(String(a));
  const bNum = parseFloat(String(b));

  if (isNaN(aNum) || !Number.isFinite(aNum)) {
    throw new Error(
      `Invalid value: ${a}. Value must be a valid finite number.`
    );
  }

  if (isNaN(bNum) || !Number.isFinite(bNum)) {
    throw new Error(
      `Invalid value: ${b}. Value must be a valid finite number.`
    );
  }

  return Math.max(aNum, bNum);
};

/**
 * Get the minimum of two numbers (for price calculations)
 * @param a - First number
 * @param b - Second number
 * @returns Minimum value as number
 * @throws Error if inputs are invalid
 */
export const min = (a: number | string, b: number | string): number => {
  const aNum = parseFloat(String(a));
  const bNum = parseFloat(String(b));

  if (isNaN(aNum) || !Number.isFinite(aNum)) {
    throw new Error(
      `Invalid value: ${a}. Value must be a valid finite number.`
    );
  }

  if (isNaN(bNum) || !Number.isFinite(bNum)) {
    throw new Error(
      `Invalid value: ${b}. Value must be a valid finite number.`
    );
  }

  return Math.min(aNum, bNum);
};

/**
 * Get absolute value of a number (for price calculations)
 * @param value - Number value
 * @returns Absolute value as number
 * @throws Error if value is invalid
 */
export const abs = (value: number | string): number => {
  const numValue = parseFloat(String(value));

  if (isNaN(numValue) || !Number.isFinite(numValue)) {
    throw new Error(
      `Invalid value: ${value}. Value must be a valid finite number.`
    );
  }

  return Math.abs(numValue);
};

/**
 * Floor a number (round down)
 * @param value - Number value
 * @returns Floored value as integer
 * @throws Error if value is invalid
 */
export const floor = (value: number | string): number => {
  const numValue = parseFloat(String(value));

  if (isNaN(numValue) || !Number.isFinite(numValue)) {
    throw new Error(
      `Invalid value: ${value}. Value must be a valid finite number.`
    );
  }

  return Math.floor(numValue);
};

/**
 * Ceil a number (round up)
 * @param value - Number value
 * @returns Ceiled value as integer
 * @throws Error if value is invalid
 */
export const ceil = (value: number | string): number => {
  const numValue = parseFloat(String(value));

  if (isNaN(numValue) || !Number.isFinite(numValue)) {
    throw new Error(
      `Invalid value: ${value}. Value must be a valid finite number.`
    );
  }

  return Math.ceil(numValue);
};
