import { calculateOrderTotalCents } from "./productAmountCalculations.js";

const MAX_TAX_RATE = 100; // 100%
const MAX_TAX_AMOUNT_CENTS = 1_000_000_000_000;

/**
 * Calculate tax amount in cents (integer)
 * @param subtotalCents - Subtotal amount in cents
 * @param taxRate - Tax rate as percentage (e.g., 8.5 for 8.5%)
 * @returns Tax amount in cents (integer)
 * @throws Error if tax rate is invalid
 */
export const calculateTaxAmountCents = (
  subtotalCents: number,
  taxRate: number | string
): number => {
  const rate = parseFloat(String(taxRate));

  if (isNaN(rate) || !Number.isFinite(rate)) {
    throw new Error(
      `Invalid tax rate: ${taxRate}. Tax rate must be a valid finite number.`
    );
  }
  if (rate < 0) {
    throw new Error(`Invalid tax rate: ${taxRate}. Tax rate must be >= 0.`);
  }
  if (rate > MAX_TAX_RATE) {
    throw new Error(
      `Tax rate ${taxRate}% exceeds maximum allowed (${MAX_TAX_RATE}%)`
    );
  }

  if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
    throw new Error(
      `Invalid subtotal: ${subtotalCents}. Subtotal must be a valid non-negative number.`
    );
  }

  const taxAmountCents = Math.round((subtotalCents * rate) / 100);

  if (!Number.isFinite(taxAmountCents) || taxAmountCents < 0) {
    throw new Error(
      `Tax calculation resulted in invalid value. subtotal: ${subtotalCents}, taxRate: ${taxRate}`
    );
  }
  if (taxAmountCents > MAX_TAX_AMOUNT_CENTS) {
    throw new Error(
      `Calculated tax amount exceeds maximum allowed (${MAX_TAX_AMOUNT_CENTS} cents)`
    );
  }

  return taxAmountCents;
};

/**
 * Calculate tax amount from subtotal and tax rate
 * @param subtotalCents - Subtotal amount in cents
 * @param taxRate - Tax rate as percentage (e.g., 8.5 for 8.5%)
 * @returns Formatted tax amount string with 2 decimal places (e.g., "15.60")
 * @throws Error if tax rate is invalid
 */
export const calculateTaxAmount = (
  subtotalCents: number,
  taxRate: number | string
): string => {
  const cents = calculateTaxAmountCents(subtotalCents, taxRate);
  return (cents / 100).toFixed(2);
};

/**
 * Calculate order totals with tax (subtotal, tax, total)
 * @param products - Array of products with quantity and rate fields
 * @param taxRate - Optional tax rate as percentage (e.g., 8.5 for 8.5%)
 * @returns Object with subtotal, taxAmount, and total in cents (integers)
 * @throws Error if any product has invalid quantity or rate, or if tax rate is invalid
 */
export const calculateOrderTotalsWithTaxCents = (
  products: Array<{
    quantity?: number | string;
    rate?: number | string;
    [key: string]: any;
  }>,
  taxRate?: number | string
): {
  subtotalCents: number;
  taxAmountCents: number;
  totalCents: number;
} => {
  const subtotalCents = calculateOrderTotalCents(products);
  const taxRateValue = taxRate ? parseFloat(String(taxRate)) : 0;
  const taxAmountCents =
    taxRateValue > 0 ? calculateTaxAmountCents(subtotalCents, taxRateValue) : 0;
  const totalCents = subtotalCents + taxAmountCents;

  return {
    subtotalCents,
    taxAmountCents,
    totalCents,
  };
};

/**
 * Calculate order totals with tax (subtotal, tax, total) - formatted strings
 * @param products - Array of products with quantity and rate fields
 * @param taxRate - Optional tax rate as percentage (e.g., 8.5 for 8.5%)
 * @returns Object with subtotal, taxAmount, and total as formatted strings
 * @throws Error if any product has invalid quantity or rate, or if tax rate is invalid
 */
export const calculateOrderTotalsWithTax = (
  products: Array<{
    quantity?: number | string;
    rate?: number | string;
    [key: string]: any;
  }>,
  taxRate?: number | string
): {
  subtotal: string;
  taxAmount: string;
  total: string;
  taxRate: number;
} => {
  const { subtotalCents, taxAmountCents, totalCents } =
    calculateOrderTotalsWithTaxCents(products, taxRate);
  const taxRateValue = taxRate ? parseFloat(String(taxRate)) : 0;

  return {
    subtotal: (subtotalCents / 100).toFixed(2),
    taxAmount: (taxAmountCents / 100).toFixed(2),
    total: (totalCents / 100).toFixed(2),
    taxRate: taxRateValue,
  };
};
