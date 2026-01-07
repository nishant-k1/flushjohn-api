/**
 * Invoice Expiration Calculations
 * Single source of truth for invoice payment link expiration calculations
 * Invoice payment links expire 24 hours after creation
 */

/**
 * Calculate invoice expiration date (24 hours from a given date)
 * @param {Date | string} startDate - The date to calculate expiration from (defaults to now)
 * @returns {Date} - The expiration date (24 hours after startDate)
 */
export const calculateInvoiceExpirationDate = (
  startDate?: Date | string
): Date => {
  const baseDate = startDate
    ? typeof startDate === "string"
      ? new Date(startDate)
      : startDate
    : new Date();

  const expirationDate = new Date(baseDate);
  expirationDate.setHours(expirationDate.getHours() + 24);
  return expirationDate;
};

/**
 * Calculate invoice expiration timestamp in milliseconds
 * @param {Date | string} startDate - The date to calculate expiration from (defaults to now)
 * @returns {number} - The expiration timestamp in milliseconds
 */
export const calculateInvoiceExpirationTimestamp = (
  startDate?: Date | string
): number => {
  const expirationDate = calculateInvoiceExpirationDate(startDate);
  return expirationDate.getTime();
};

/**
 * Calculate invoice expiration ISO string (for storage in metadata)
 * @param {Date | string} startDate - The date to calculate expiration from (defaults to now)
 * @returns {string} - The expiration date as ISO string
 */
export const calculateInvoiceExpirationISO = (
  startDate?: Date | string
): string => {
  const expirationDate = calculateInvoiceExpirationDate(startDate);
  return expirationDate.toISOString();
};

/**
 * Calculate cutoff time for expired invoices (24 hours ago from now)
 * Used to find invoices that have expired
 * @returns {Date} - The cutoff date (24 hours before now)
 */
export const calculateInvoiceExpirationCutoff = (): Date => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24);
  return cutoffTime;
};

/**
 * Format expiration date for display in emails and PDFs
 * @param {Date | string} expirationDate - The expiration date to format
 * @returns {string} - Formatted expiration date string
 */
export const formatInvoiceExpirationDate = (
  expirationDate: Date | string
): string => {
  const date =
    typeof expirationDate === "string"
      ? new Date(expirationDate)
      : expirationDate;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format expiration date for display in UI (shorter format)
 * @param {Date | string} expirationDate - The expiration date to format
 * @returns {string} - Formatted expiration date string
 */
export const formatInvoiceExpirationDateShort = (
  expirationDate: Date | string
): string => {
  const date =
    typeof expirationDate === "string"
      ? new Date(expirationDate)
      : expirationDate;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Check if an invoice has expired based on creation date
 * @param {Date | string} createdAt - The invoice creation date
 * @returns {boolean} - True if invoice has expired (more than 24 hours old)
 */
export const isInvoiceExpired = (createdAt: Date | string): boolean => {
  const creationDate =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const cutoffTime = calculateInvoiceExpirationCutoff();
  return creationDate <= cutoffTime;
};
