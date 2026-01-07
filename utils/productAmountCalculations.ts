import { dollarsToCents, centsToDollars, add } from "./priceCalculations";
import { round } from "./numericCalculations";

const MAX_QUANTITY = 1_000_000;
const MAX_RATE = 1_000_000;
const MAX_AMOUNT_CENTS = 1_000_000_000_000;

/**
 * Calculate product amount in cents (integer)
 * @param quantity - Quantity (can be number or string)
 * @param rate - Rate in dollars (can be number or string)
 * @returns Amount in cents (integer)
 * @throws Error if quantity or rate is invalid
 */
export const calculateProductAmountCents = (
  quantity: number | string,
  rate: number | string
): number => {
  const qtyValue = parseFloat(String(quantity));
  const productRate = parseFloat(String(rate));

  if (isNaN(qtyValue) || !Number.isFinite(qtyValue)) {
    throw new Error(
      `Invalid quantity: ${quantity}. Quantity must be a valid finite number.`
    );
  }
  if (qtyValue < 0) {
    throw new Error(`Invalid quantity: ${quantity}. Quantity must be >= 0.`);
  }
  if (qtyValue > MAX_QUANTITY) {
    throw new Error(
      `Quantity ${quantity} exceeds maximum allowed (${MAX_QUANTITY})`
    );
  }

  if (isNaN(productRate) || !Number.isFinite(productRate)) {
    throw new Error(
      `Invalid rate: ${rate}. Rate must be a valid finite number.`
    );
  }
  if (productRate < 0) {
    throw new Error(`Invalid rate: ${rate}. Rate must be >= 0.`);
  }
  if (productRate > MAX_RATE) {
    throw new Error(`Rate ${rate} exceeds maximum allowed (${MAX_RATE})`);
  }

  const amountInDollars = qtyValue * productRate;
  const amountInCents = dollarsToCents(amountInDollars);

  if (!Number.isFinite(amountInCents) || amountInCents < 0) {
    throw new Error(
      `Calculation resulted in invalid value. quantity: ${quantity}, rate: ${rate}`
    );
  }
  if (amountInCents > MAX_AMOUNT_CENTS) {
    throw new Error(
      `Calculated amount exceeds maximum allowed (${MAX_AMOUNT_CENTS} cents)`
    );
  }

  return amountInCents;
};

/**
 * Calculate product amount from quantity and rate
 * @param quantity - Quantity (can be number or string)
 * @param rate - Rate (can be number or string)
 * @returns Formatted amount string with 2 decimal places (e.g., "195.00")
 * @throws Error if quantity or rate is invalid
 */
export const calculateProductAmount = (
  quantity: number | string,
  rate: number | string
): string => {
  const cents = calculateProductAmountCents(quantity, rate);
  return centsToDollars(cents);
};

/**
 * Calculate order total in cents (integer)
 * @param products - Array of products with quantity and rate fields
 * @returns Total amount in cents (integer)
 * @throws Error if any product has invalid quantity or rate
 */
export const calculateOrderTotalCents = (
  products: Array<{
    quantity?: number | string;
    rate?: number | string;
    [key: string]: any;
  }>
): number => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return 0;
  }

  const totalCents = products.reduce((sum, product, index) => {
    const quantity = product.quantity;
    const rate = product.rate;

    if (quantity == null) {
      throw new Error(
        `Product at index ${index} is missing 'quantity' field. Product: ${JSON.stringify(
          product
        )}`
      );
    }
    if (rate == null) {
      throw new Error(
        `Product at index ${index} is missing 'rate' field. Product: ${JSON.stringify(
          product
        )}`
      );
    }

    return add(sum, calculateProductAmountCents(quantity, rate));
  }, 0);

  if (!Number.isFinite(totalCents) || totalCents < 0) {
    throw new Error(
      `Order total calculation resulted in invalid value. Products: ${JSON.stringify(
        products
      )}`
    );
  }
  if (totalCents > MAX_AMOUNT_CENTS) {
    throw new Error(
      `Order total exceeds maximum allowed (${MAX_AMOUNT_CENTS} cents)`
    );
  }

  return totalCents;
};

/**
 * Calculate total amount from products array
 * @param products - Array of products with quantity and rate fields
 * @returns Formatted total amount string with 2 decimal places (e.g., "195.00")
 * @throws Error if any product has invalid quantity or rate
 */
export const calculateOrderTotal = (
  products: Array<{
    quantity?: number | string;
    rate?: number | string;
    [key: string]: any;
  }>
): string => {
  const cents = calculateOrderTotalCents(products);
  return centsToDollars(cents);
};
