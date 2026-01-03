/**
 * Utility functions for safely handling undefined/null values in templates
 */
/**
 * Safely get a value or return empty string if undefined/null
 */
export declare const safeValue: (value: unknown, fallback?: string) => string;
/**
 * Safely get a nested object property
 */
export declare const safeGet: (obj: Record<string, any> | null | undefined, path: string, fallback?: string) => string;
/**
 * Safely format a date
 */
export declare const safeDate: (dateValue: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
/**
 * Safely format currency with US format (thousand separators)
 */
export declare const safeCurrency: (amount: number | string | null | undefined) => string;
/**
 * Safely format phone number
 */
export declare const safePhone: (phone: string | null | undefined) => string;
//# sourceMappingURL=safeValue.d.ts.map