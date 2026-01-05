/**
 * Common type definitions for the API
 */
/**
 * Type guard for ValidationError
 */
export function isValidationError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ValidationError");
}
/**
 * Type guard for DuplicateKeyError
 */
export function isDuplicateKeyError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000);
}
/**
 * Type guard for UserJwtPayload
 */
export function isUserJwtPayload(decoded) {
    return (typeof decoded === "object" &&
        decoded !== null &&
        "userId" in decoded &&
        typeof decoded.userId === "string");
}
/**
 * Parse pagination query parameters
 */
export function parsePaginationQuery(query) {
    const page = parseInt(String(query.page || "1"), 10);
    const limit = parseInt(String(query.limit || "10"), 10);
    const sortBy = String(query.sortBy || "createdAt");
    const sortOrder = String(query.sortOrder || "desc");
    const search = String(query.search || query.searchQuery || "");
    return {
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit,
        sortBy,
        sortOrder: sortOrder === "asc" ? "asc" : "desc",
        search,
    };
}
/**
 * Safe string conversion for query parameters
 */
export function safeStringQuery(value, defaultValue = "") {
    if (Array.isArray(value)) {
        return String(value[0] || defaultValue);
    }
    if (typeof value === "string") {
        return value;
    }
    return value ? String(value) : defaultValue;
}
/**
 * Safe number conversion for query parameters
 */
export function safeNumberQuery(value, defaultValue = 0) {
    const str = safeStringQuery(value, String(defaultValue));
    const num = parseInt(str, 10);
    return isNaN(num) ? defaultValue : num;
}
//# sourceMappingURL=common.js.map