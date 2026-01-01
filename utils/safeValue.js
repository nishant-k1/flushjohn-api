/**
 * Utility functions for safely handling undefined/null values in templates
 */

/**
 * Safely get a value or return empty string if undefined/null
 * @param {any} value - The value to check
 * @param {string} fallback - Fallback value (default: empty string)
 * @returns {string} - Safe string value
 */
export const safeValue = (value, fallback = "") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
};

/**
 * Safely get a nested object property
 * @param {object} obj - The object to access
 * @param {string} path - Dot notation path (e.g., 'vendor.name')
 * @param {string} fallback - Fallback value (default: empty string)
 * @returns {string} - Safe string value
 */
export const safeGet = (obj, path, fallback = "") => {
  if (!obj || typeof obj !== "object") {
    return fallback;
  }

  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return fallback;
    }
    current = current[key];
  }

  return safeValue(current, fallback);
};

/**
 * Safely format a date
 * @param {string|Date} dateValue - Date value to format
 * @param {object} options - Date formatting options
 * @returns {string} - Formatted date or fallback
 */
export const safeDate = (dateValue, options = {}) => {
  if (!dateValue || dateValue === "1970-01-01T00:00:00.000Z") {
    return "TBD"; // To Be Determined
  }

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return "TBD";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    });
  } catch (error) {
    return "TBD";
  }
};

/**
 * Safely format currency with US format (thousand separators)
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted currency with US format (e.g., $1,234.56) or $0
 */
export const safeCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return "$0.00";
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return "$0.00";
  }

  // Format with US locale (comma for thousands, period for decimals)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Safely format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone or empty string
 */
export const safePhone = (phone) => {
  if (!phone || phone === "") {
    return "";
  }

  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return as-is if not 10 digits
  return phone;
};
