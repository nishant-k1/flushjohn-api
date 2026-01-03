/**
 * Pagination middleware to enforce consistent limits
 */
import { Request, Response, NextFunction } from "express";
/**
 * Middleware to validate and normalize pagination parameters
 */
export declare const paginationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate pagination parameters (returns errors array)
 */
export declare const validatePagination: (page: number | string, limit: number | string) => string[];
//# sourceMappingURL=pagination.d.ts.map