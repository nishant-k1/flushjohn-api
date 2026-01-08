/**
 * Common type definitions for the API
 */

import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";

// ParsedQs type for query parameters
export type ParsedQs = Record<string, string | string[] | undefined>;

/**
 * Express route handler type
 */
export type RouteHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void> | void;

/**
 * Async route handler type
 */
export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => Promise<void>;

/**
 * Query parameter types
 */
export interface PaginationQuery {
  page?: string | string[];
  limit?: string | string[];
  sortBy?: string | string[];
  sortOrder?: string | string[];
  search?: string | string[];
  searchQuery?: string | string[];
}

/**
 * Parsed pagination parameters
 */
export interface ParsedPagination {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search: string;
}

/**
 * Mongoose query filter type
 */
export type MongooseFilter<T = Record<string, unknown>> = {
  [K in keyof T]?: T[K] | { $or?: Array<{ [key: string]: unknown }> };
} & Record<string, unknown> & {
    $expr?: any;
    $or?: Array<{ [key: string]: unknown }>;
    $and?: Array<{ [key: string]: unknown }>;
  };

/**
 * JWT decoded payload with userId
 */
export interface UserJwtPayload extends JwtPayload {
  userId: string;
  iat?: number;
}

/**
 * Validation error type
 */
export interface ValidationError extends Error {
  name: "ValidationError";
  errors?: Record<string, { message: string }>;
}

/**
 * MongoDB duplicate key error
 */
export interface DuplicateKeyError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ValidationError"
  );
}

/**
 * Type guard for DuplicateKeyError
 */
export function isDuplicateKeyError(
  error: unknown
): error is DuplicateKeyError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DuplicateKeyError).code === 11000
  );
}

/**
 * Type guard for UserJwtPayload
 */
export function isUserJwtPayload(
  decoded: string | JwtPayload
): decoded is UserJwtPayload {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    typeof decoded.userId === "string"
  );
}

/**
 * Parse pagination query parameters
 */
export function parsePaginationQuery(query: PaginationQuery): ParsedPagination {
  const page = parseInt(String(query.page || "1"), 10);
  const limit = parseInt(String(query.limit || "10"), 10);
  const sortBy = String(query.sortBy || "createdAt");
  const sortOrder = String(query.sortOrder || "desc") as "asc" | "desc";
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
export function safeStringQuery(
  value: string | string[] | ParsedQs | undefined,
  defaultValue: string = ""
): string {
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
export function safeNumberQuery(
  value: string | string[] | undefined,
  defaultValue: number = 0
): number {
  const str = safeStringQuery(value, String(defaultValue));
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
}
