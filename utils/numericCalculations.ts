/**
 * General Numeric Calculation Utilities
 * Single source of truth for all non-price numeric calculations
 * Includes pagination, file sizes, reading time, scores, and other numeric operations
 */

/**
 * Calculate total pages for pagination
 * @param total - Total number of items
 * @param limit - Items per page
 * @returns Total number of pages
 */
export const calculateTotalPages = (total: number, limit: number): number => {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error(`Invalid total: ${total}. Total must be a valid non-negative number.`);
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error(`Invalid limit: ${limit}. Limit must be a valid positive number.`);
  }
  return Math.ceil(total / limit);
};

/**
 * Calculate skip value for pagination
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @returns Skip value for database query
 */
export const calculateSkip = (page: number, limit: number): number => {
  if (!Number.isFinite(page) || page < 1) {
    throw new Error(`Invalid page: ${page}. Page must be >= 1.`);
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error(`Invalid limit: ${limit}. Limit must be a valid positive number.`);
  }
  return (page - 1) * limit;
};

/**
 * Round a number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export const roundToDecimals = (value: number, decimals: number = 2): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid value: ${value}. Value must be a valid finite number.`);
  }
  if (!Number.isFinite(decimals) || decimals < 0) {
    throw new Error(`Invalid decimals: ${decimals}. Decimals must be a valid non-negative number.`);
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Convert bytes to megabytes
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Size in megabytes as formatted string
 */
export const bytesToMB = (bytes: number, decimals: number = 2): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error(`Invalid bytes: ${bytes}. Bytes must be a valid non-negative number.`);
  }
  const mb = bytes / (1024 * 1024);
  return roundToDecimals(mb, decimals).toFixed(decimals);
};

/**
 * Calculate estimated reading time in minutes
 * @param wordCount - Number of words
 * @param wordsPerMinute - Average reading speed (default: 200)
 * @returns Estimated reading time in minutes
 */
export const calculateReadingTime = (wordCount: number, wordsPerMinute: number = 200): number => {
  if (!Number.isFinite(wordCount) || wordCount < 0) {
    throw new Error(`Invalid wordCount: ${wordCount}. Word count must be a valid non-negative number.`);
  }
  if (!Number.isFinite(wordsPerMinute) || wordsPerMinute <= 0) {
    throw new Error(`Invalid wordsPerMinute: ${wordsPerMinute}. Words per minute must be a valid positive number.`);
  }
  if (wordCount === 0) {
    return 0;
  }
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Calculate exponential backoff delay
 * @param attempts - Number of attempts (exponent)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @returns Delay in milliseconds
 */
export const calculateExponentialBackoff = (attempts: number, baseDelayMs: number = 1000): number => {
  if (!Number.isFinite(attempts) || attempts < 0) {
    throw new Error(`Invalid attempts: ${attempts}. Attempts must be a valid non-negative number.`);
  }
  if (!Number.isFinite(baseDelayMs) || baseDelayMs <= 0) {
    throw new Error(`Invalid baseDelayMs: ${baseDelayMs}. Base delay must be a valid positive number.`);
  }
  return Math.pow(2, attempts) * baseDelayMs;
};

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid value: ${value}. Value must be a valid finite number.`);
  }
  if (!Number.isFinite(min)) {
    throw new Error(`Invalid min: ${min}. Min must be a valid finite number.`);
  }
  if (!Number.isFinite(max)) {
    throw new Error(`Invalid max: ${max}. Max must be a valid finite number.`);
  }
  if (min > max) {
    throw new Error(`Invalid range: min (${min}) must be <= max (${max}).`);
  }
  return Math.min(max, Math.max(min, value));
};

/**
 * Calculate average from an array of numbers
 * @param values - Array of numeric values (numbers or strings that can be parsed)
 * @returns Average as number
 * @throws Error if array is empty or contains invalid values
 */
export const calculateAverage = (values: Array<number | string>): number => {
  if (!values || !Array.isArray(values) || values.length === 0) {
    throw new Error("Values array must be non-empty");
  }

  // Convert all values to numbers and filter out invalid ones
  const numericValues = values
    .map((v) => parseFloat(String(v)))
    .filter((v) => Number.isFinite(v));

  if (numericValues.length === 0) {
    throw new Error("No valid numeric values found in array");
  }

  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const average = sum / numericValues.length;

  if (!Number.isFinite(average)) {
    throw new Error(
      `Average calculation resulted in invalid value. Values: ${JSON.stringify(values)}`
    );
  }

  return average;
};

