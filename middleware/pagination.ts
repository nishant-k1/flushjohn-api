/**
 * Pagination middleware to enforce consistent limits
 */

import { Request, Response, NextFunction } from "express";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

/**
 * Middleware to validate and normalize pagination parameters
 */
export const paginationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = Math.max(1, parseInt(String(req.query.page)) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(req.query.limit)) || DEFAULT_LIMIT)
  );

  // Normalize pagination params
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  // Override query params with normalized values
  req.query.page = String(page);
  req.query.limit = String(limit);

  next();
};

/**
 * Validate pagination parameters (returns errors array)
 */
export const validatePagination = (
  page: number | string,
  limit: number | string
): string[] => {
  const errors: string[] = [];

  const pageNum = typeof page === "string" ? parseInt(page) : page;
  const limitNum = typeof limit === "string" ? parseInt(limit) : limit;

  if (isNaN(pageNum) || pageNum < 1) {
    errors.push("Page must be a positive integer");
  }

  if (isNaN(limitNum) || limitNum < 1) {
    errors.push("Limit must be a positive integer");
  }

  if (limitNum > MAX_LIMIT) {
    errors.push(`Limit cannot exceed ${MAX_LIMIT}`);
  }

  return errors;
};
