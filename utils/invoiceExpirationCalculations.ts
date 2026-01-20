/**
 * Invoice Expiration Calculations
 * Single source of truth for invoice payment link expiration calculations
 * Invoice payment links expire 24 hours after creation
 */

import { dayjs } from "../lib/dayjs.js";

/**
 * Calculate invoice expiration date (24 hours from a given date)
 * @param {Date | string} startDate - The date to calculate expiration from (defaults to now in US timezone)
 * @returns {Date} - The expiration date (24 hours after startDate)
 */
export const calculateInvoiceExpirationDate = (
  startDate?: Date | string
): Date => {
  const baseDate = startDate
    ? dayjs(startDate).tz("America/New_York")
    : dayjs().tz("America/New_York");

  const expirationDate = baseDate.add(24, "hour");
  return expirationDate.toDate();
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
 * @returns {Date} - The cutoff date (24 hours before now in US timezone)
 */
export const calculateInvoiceExpirationCutoff = (): Date => {
  const cutoffTime = dayjs().tz("America/New_York").subtract(24, "hour");
  return cutoffTime.toDate();
};

/**
 * Format expiration date for display in emails and PDFs
 * @param {Date | string} expirationDate - The expiration date to format
 * @returns {string} - Formatted expiration date string (US timezone)
 */
export const formatInvoiceExpirationDate = (
  expirationDate: Date | string
): string => {
  const date = dayjs(expirationDate).tz("America/New_York");

  return date.toDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
};

/**
 * Format expiration date for display in UI (shorter format)
 * @param {Date | string} expirationDate - The expiration date to format
 * @returns {string} - Formatted expiration date string (US timezone)
 */
export const formatInvoiceExpirationDateShort = (
  expirationDate: Date | string
): string => {
  const date = dayjs(expirationDate).tz("America/New_York");

  return date.toDate().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });
};

/**
 * Check if an invoice has expired based on creation date
 * @param {Date | string} createdAt - The invoice creation date
 * @returns {boolean} - True if invoice has expired (more than 24 hours old in US timezone)
 */
export const isInvoiceExpired = (createdAt: Date | string): boolean => {
  const creationDate = dayjs(createdAt).tz("America/New_York");
  const cutoffTime = dayjs(calculateInvoiceExpirationCutoff()).tz("America/New_York");
  return creationDate.isSameOrBefore(cutoffTime);
};
