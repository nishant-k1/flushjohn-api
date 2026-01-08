/**
 * Utility functions for safely handling undefined/null values in templates
 */

/**
 * Safely get a value or return empty string if undefined/null
 * Trims whitespace and treats whitespace-only values as empty
 */
export const safeValue = (value: unknown, fallback: string = ""): string => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const str = String(value);
  const trimmed = str.trim();

  // Return fallback if trimmed value is empty (whitespace-only)
  if (!trimmed) {
    return fallback;
  }

  return trimmed;
};

/**
 * Safely get a nested object property
 */
export const safeGet = (
  obj: Record<string, any> | null | undefined,
  path: string,
  fallback: string = ""
): string => {
  if (!obj || typeof obj !== "object") {
    return fallback;
  }

  const keys = path.split(".");
  let current: any = obj;

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
 * Uses US local timezone (America/New_York) by default
 */
export const safeDate = (
  dateValue: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
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
      timeZone: options.timeZone || "America/New_York", // US local timezone
      ...options,
    });
  } catch {
    return "TBD";
  }
};

/**
 * Safely format currency with US format (thousand separators)
 */
export const safeCurrency = (
  amount: number | string | null | undefined
): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "$0.00";
  }

  const numAmount = parseFloat(String(amount));
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
 * Handles E.164 format (+1XXXXXXXXXX) and regular formats
 */
export const safePhone = (phone: string | null | undefined): string => {
  if (!phone || phone === "") {
    return "";
  }

  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle E.164 format: if 11 digits and starts with 1, remove the leading 1
  let phoneDigits = digits;
  if (digits.length === 11 && digits.startsWith("1")) {
    phoneDigits = digits.slice(1); // Remove the leading 1 (country code)
  }

  // Format as (XXX) XXX-XXXX if 10 digits
  if (phoneDigits.length === 10) {
    return `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
  }

  // Return as-is if not 10 digits after processing
  return phone;
};
