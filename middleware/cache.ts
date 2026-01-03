/**
 * In-memory cache middleware for API responses
 * Provides caching for read-heavy endpoints like dashboard analytics
 */

import { Request, Response, NextFunction } from "express";

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generate cache key from request
 */
const generateCacheKey = (req: Request): string => {
  const path = req.path;
  const query = JSON.stringify(req.query);
  const user = req.user?.userId || "anonymous";
  return `${path}:${query}:${user}`;
};

type KeyGenerator = (req: Request) => string;

/**
 * Cache middleware factory
 */
export const cacheMiddleware = (
  ttl: number = DEFAULT_TTL,
  keyGenerator: KeyGenerator = generateCacheKey
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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
    res.json = function (data: any) {
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
export const clearCache = (pattern?: string): void => {
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
export const clearAllCache = (): void => {
  cache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
};
