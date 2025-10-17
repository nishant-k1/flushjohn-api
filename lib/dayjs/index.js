import dayjs from "dayjs";
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
export const createDate = (date = null) => {
  if (!date) return dayjs().tz(US_TIMEZONE);
  return dayjs(date).tz(US_TIMEZONE);
};

export const createUTCDate = (date = null) => {
  if (!date) return dayjs().utc();
  return dayjs(date).utc();
};

export const formatDate = (date, format = "YYYY-MM-DD") => {
  return createDate(date).format(format);
};

export const formatDateTime = (date, format = "YYYY-MM-DD HH:mm:ss") => {
  return createDate(date).format(format);
};

export const formatDateForAPI = (date) => {
  return createDate(date).toISOString();
};

export const parseDate = (dateString, format = null) => {
  if (format) {
    return dayjs(dateString, format).tz(US_TIMEZONE);
  }
  return createDate(dateString);
};

export const isDateValid = (date) => {
  return createDate(date).isValid();
};

export const addDays = (date, days) => {
  return createDate(date).add(days, "day");
};

export const addMonths = (date, months) => {
  return createDate(date).add(months, "month");
};

export const addYears = (date, years) => {
  return createDate(date).add(years, "year");
};

export const startOfDay = (date) => {
  return createDate(date).startOf("day");
};

export const endOfDay = (date) => {
  return createDate(date).endOf("day");
};

export const startOfMonth = (date) => {
  return createDate(date).startOf("month");
};

export const endOfMonth = (date) => {
  return createDate(date).endOf("month");
};

export const isSameDay = (date1, date2) => {
  return createDate(date1).isSame(createDate(date2), "day");
};

export const isAfter = (date1, date2) => {
  return createDate(date1).isAfter(createDate(date2));
};

export const isBefore = (date1, date2) => {
  return createDate(date1).isBefore(createDate(date2));
};

export const isSameOrAfterDate = (date1, date2) => {
  return createDate(date1).isSameOrAfter(createDate(date2));
};

export const isSameOrBeforeDate = (date1, date2) => {
  return createDate(date1).isSameOrBefore(createDate(date2));
};

export const getCurrentDate = () => {
  return createDate();
};

export const getCurrentDateTime = () => {
  return createDate();
};

export const getCurrentTimestamp = () => {
  return createDate().valueOf();
};

export const getCurrentISOString = () => {
  return createDate().toISOString();
};

// Export dayjs instance for advanced usage
export { dayjs };
export default dayjs;
