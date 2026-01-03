import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Set default timezone to US Eastern Time
const US_TIMEZONE = "America/New_York";

// Configure dayjs to use US timezone by default
dayjs.tz.setDefault(US_TIMEZONE);

// Helper functions for common date operations
export const createDate = (date: string | Date | null = null): Dayjs => {
  if (!date) return dayjs().tz(US_TIMEZONE);
  return dayjs(date).tz(US_TIMEZONE);
};

export const createUTCDate = (date: string | Date | null = null): Dayjs => {
  if (!date) return dayjs().utc();
  return dayjs(date).utc();
};

export const formatDate = (
  date: string | Date | null,
  format: string = "YYYY-MM-DD"
): string => {
  return createDate(date).format(format);
};

export const formatDateTime = (
  date: string | Date | null,
  format: string = "YYYY-MM-DD HH:mm:ss"
): string => {
  return createDate(date).format(format);
};

export const formatDateForAPI = (date: string | Date | null): string => {
  return createDate(date).toISOString();
};

export const parseDate = (
  dateString: string,
  format: string | null = null
): Dayjs => {
  if (format) {
    return dayjs(dateString, format).tz(US_TIMEZONE);
  }
  return createDate(dateString);
};

export const isDateValid = (date: string | Date | null): boolean => {
  return createDate(date).isValid();
};

export const addDays = (date: string | Date | null, days: number): Dayjs => {
  return createDate(date).add(days, "day");
};

export const addMonths = (
  date: string | Date | null,
  months: number
): Dayjs => {
  return createDate(date).add(months, "month");
};

export const addYears = (date: string | Date | null, years: number): Dayjs => {
  return createDate(date).add(years, "year");
};

export const startOfDay = (date: string | Date | null): Dayjs => {
  return createDate(date).startOf("day");
};

export const endOfDay = (date: string | Date | null): Dayjs => {
  return createDate(date).endOf("day");
};

export const startOfMonth = (date: string | Date | null): Dayjs => {
  return createDate(date).startOf("month");
};

export const endOfMonth = (date: string | Date | null): Dayjs => {
  return createDate(date).endOf("month");
};

export const isSameDay = (
  date1: string | Date | null,
  date2: string | Date | null
): boolean => {
  return createDate(date1).isSame(createDate(date2), "day");
};

export const isAfter = (
  date1: string | Date | null,
  date2: string | Date | null
): boolean => {
  return createDate(date1).isAfter(createDate(date2));
};

export const isBefore = (
  date1: string | Date | null,
  date2: string | Date | null
): boolean => {
  return createDate(date1).isBefore(createDate(date2));
};

export const isSameOrAfterDate = (
  date1: string | Date | null,
  date2: string | Date | null
): boolean => {
  return createDate(date1).isSameOrAfter(createDate(date2));
};

export const isSameOrBeforeDate = (
  date1: string | Date | null,
  date2: string | Date | null
): boolean => {
  return createDate(date1).isSameOrBefore(createDate(date2));
};

export const getCurrentDate = (): Dayjs => {
  return createDate();
};

export const getCurrentDateTime = (): Dayjs => {
  return createDate();
};

export const getCurrentTimestamp = (): number => {
  return createDate().valueOf();
};

export const getCurrentISOString = (): string => {
  return createDate().toISOString();
};

// Export dayjs instance for advanced usage
export { dayjs };
export default dayjs;
