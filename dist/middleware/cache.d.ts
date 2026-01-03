/**
 * In-memory cache middleware for API responses
 * Provides caching for read-heavy endpoints like dashboard analytics
 */
import { Request, Response, NextFunction } from "express";
type KeyGenerator = (req: Request) => string;
/**
 * Cache middleware factory
 */
export declare const cacheMiddleware: (ttl?: number, keyGenerator?: KeyGenerator) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Clear cache for specific pattern
 */
export declare const clearCache: (pattern?: string) => void;
/**
 * Clear all cache
 */
export declare const clearAllCache: () => void;
/**
 * Get cache statistics
 */
export declare const getCacheStats: () => {
    size: number;
    keys: string[];
};
export {};
//# sourceMappingURL=cache.d.ts.map