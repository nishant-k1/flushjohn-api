/**
 * Data Serialization Utilities
 *
 * Centralized functions to serialize data into standard storage formats
 * before saving to the database. This ensures data consistency
 * across all sources (web forms, CRM, API calls, etc.)
 *
 * Serialization = Converting user input → database storage format
 */

/**
 * Normalize phone number to E.164 format
 *
 * Converts any phone format to: +1XXXXXXXXXX
 * - Removes all non-digit characters
 * - Adds +1 country code if not present
 * - Returns null for invalid phone numbers
 *
 * Examples:
 * - "(123) 456-7890" -> "+11234567890"
 * - "123-456-7890" -> "+11234567890"
 * - "+1 234 567 8901" -> "+12345678901"
 * - "2345678901" -> "+12345678901"
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone in E.164 format or null if invalid
 */
export const serializePhoneNumber = (
  phone: string | null | undefined
): string | null => {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Validate: must have 10 digits, or 11 digits starting with 1
  if (digits.length === 10) {
    // US number without country code: add +1
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    // US number with country code 1
    return `+${digits}`;
  }

  // Invalid phone number
  return null;
};

/**
 * Normalize ZIP code to standard 5-digit format
 *
 * Converts ZIP+4 format to 5-digit ZIP
 * - "12345-6789" -> "12345"
 * - "12345" -> "12345"
 * - Returns null for invalid ZIP codes
 *
 * @param zip - ZIP code in any format
 * @returns Normalized 5-digit ZIP or null if invalid
 */
export const serializeZipCode = (
  zip: string | null | undefined
): string | null => {
  if (!zip) return null;

  // Remove all non-digit characters
  const digits = zip.replace(/\D/g, "");

  // Validate: must have at least 5 digits
  if (digits.length >= 5) {
    // Return first 5 digits
    return digits.slice(0, 5);
  }

  // Invalid ZIP code
  return null;
};

/**
 * Normalize email to lowercase
 *
 * @param email - Email address
 * @returns Normalized email in lowercase
 */
export const serializeEmail = (
  email: string | null | undefined
): string | null => {
  if (!email) return null;
  return email.trim().toLowerCase();
};

/**
 * Normalize text field (trim and titlecase)
 *
 * @param text - Text to normalize
 * @returns Trimmed text
 */
export const serializeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.trim();
};

/**
 * Normalize name field (trim and proper case first letter)
 *
 * @param name - Name to normalize
 * @returns Trimmed and capitalized name
 */
export const serializeName = (name: string | null | undefined): string => {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";

  // Capitalize first letter, lowercase the rest
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Normalize usage type
 *
 * @param usageType - Usage type string
 * @returns Normalized usage type
 */
export const serializeUsageType = (
  usageType: string | null | undefined
): string => {
  if (!usageType) return "";
  const trimmed = usageType.trim();
  if (!trimmed) return "";

  // Capitalize first letter, lowercase the rest
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/**
 * Normalize date to ISO 8601 format
 *
 * Converts any date format to ISO 8601 string
 * - Handles Date objects, ISO strings, formatted strings
 * - Returns midnight UTC for consistent date-only values
 * - Returns null for invalid dates
 *
 * Examples:
 * - "2026-01-07" -> "2026-01-07T00:00:00.000Z"
 * - "01/07/2026" -> "2026-01-07T00:00:00.000Z"
 * - new Date() -> "2026-01-07T00:00:00.000Z"
 *
 * @param date - Date in any format
 * @returns ISO 8601 string at start of day (midnight UTC) or null if invalid
 */
export const serializeDate = (
  date: string | Date | null | undefined
): string | null => {
  if (!date) return null;

  try {
    const dateObj = new Date(date);

    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // Set to start of day UTC (midnight)
    // This ensures date-only fields like deliveryDate/pickupDate are consistent
    dateObj.setUTCHours(0, 0, 0, 0);

    // Return ISO 8601 format
    return dateObj.toISOString();
  } catch {
    return null;
  }
};

/**
 * Normalize datetime to ISO 8601 format (preserves time)
 *
 * Use this for timestamps like createdAt, updatedAt where time matters
 *
 * @param date - Date in any format
 * @returns ISO 8601 string with time or null if invalid
 */
export const serializeDateTime = (
  date: string | Date | null | undefined
): string | null => {
  if (!date) return null;

  try {
    const dateObj = new Date(date);

    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // Return ISO 8601 format with time
    return dateObj.toISOString();
  } catch {
    return null;
  }
};

/**
 * Normalize state abbreviation to uppercase
 *
 * @param state - State name or abbreviation
 * @returns Normalized state (uppercase if 2 chars, titlecase otherwise)
 */
export const serializeState = (state: string | null | undefined): string => {
  if (!state) return "";
  const trimmed = state.trim();
  if (!trimmed) return "";

  // If 2 characters, assume it's abbreviation and uppercase it
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  // Otherwise, return as titlecase
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Normalize contact data (common fields across leads, customers, quotes, etc.)
 *
 * @param data - Object containing contact information
 * @returns Object with normalized contact data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serializeContactData = (data: any): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized: any = { ...data };

  // Serialize phone fields
  if (data.phone) {
    normalized.phone = serializePhoneNumber(data.phone);
  }
  if (data.contactPersonPhone) {
    normalized.contactPersonPhone = serializePhoneNumber(
      data.contactPersonPhone
    );
  }
  if (data.fax) {
    normalized.fax = serializePhoneNumber(data.fax);
  }

  // Serialize email
  if (data.email) {
    normalized.email = serializeEmail(data.email);
  }

  // Serialize ZIP code
  if (data.zip) {
    normalized.zip = serializeZipCode(data.zip);
  }

  // Serialize state
  if (data.state) {
    normalized.state = serializeState(data.state);
  }

  // Serialize text fields
  if (data.fName !== undefined) {
    normalized.fName = serializeText(data.fName);
  }
  if (data.lName !== undefined) {
    normalized.lName = serializeText(data.lName);
  }
  if (data.cName !== undefined) {
    normalized.cName = serializeText(data.cName);
  }
  if (data.contactPersonName !== undefined) {
    normalized.contactPersonName = serializeText(data.contactPersonName);
  }
  if (data.streetAddress !== undefined) {
    normalized.streetAddress = serializeText(data.streetAddress);
  }
  if (data.city !== undefined) {
    normalized.city = serializeText(data.city);
  }
  if (data.instructions !== undefined) {
    normalized.instructions = serializeText(data.instructions);
  }

  // Serialize usage type
  if (data.usageType) {
    normalized.usageType = serializeUsageType(data.usageType);
  }

  // Serialize dates (delivery/pickup dates - use date-only serialization)
  if (data.deliveryDate) {
    normalized.deliveryDate = serializeDate(data.deliveryDate);
  }
  if (data.pickupDate) {
    normalized.pickupDate = serializeDate(data.pickupDate);
  }

  // Normalize datetime fields (if they exist and need time preserved)
  // Note: createdAt and updatedAt are handled by services, not user input

  return normalized;
};
