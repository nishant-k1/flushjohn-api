/**
 * Rate limiting middleware for different endpoint types
 */
/**
 * General API rate limiter (moderate limits)
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for expensive operations (dashboard, analytics)
 */
export declare const strictLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * File upload rate limiter
 */
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Public endpoint rate limiter (lead submission, contact forms)
 */
export declare const publicLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map