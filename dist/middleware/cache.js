/**
 * In-memory cache middleware for API responses
 * Provides caching for read-heavy endpoints like dashboard analytics
 */
const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
    const path = req.path;
    const query = JSON.stringify(req.query);
    const user = req.user?.userId || "anonymous";
    return `${path}:${query}:${user}`;
};
/**
 * Cache middleware factory
 */
export const cacheMiddleware = (ttl = DEFAULT_TTL, keyGenerator = generateCacheKey) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }
        const cacheKey = keyGenerator(req);
        const cached = cache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            // Return cached response
            res.setHeader("X-Cache", "HIT");
            return res.json(cached.data);
        }
        // Store original json method
        const originalJson = res.json.bind(res);
        // Override json method to cache response
        res.json = function (data) {
            // Cache successful responses only
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(cacheKey, {
                    data,
                    expiresAt: Date.now() + ttl,
                });
            }
            res.setHeader("X-Cache", "MISS");
            return originalJson(data);
        };
        next();
    };
};
/**
 * Clear cache for specific pattern
 */
export const clearCache = (pattern) => {
    if (!pattern) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
};
/**
 * Clear all cache
 */
export const clearAllCache = () => {
    cache.clear();
};
/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
};
//# sourceMappingURL=cache.js.map