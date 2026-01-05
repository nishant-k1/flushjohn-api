/**
 * Common type definitions for the API
 */
import { Request, Response, NextFunction, ParsedQs } from "express";
import { JwtPayload } from "jsonwebtoken";
/**
 * Express route handler type
 */
export type RouteHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void> | void;
/**
 * Async route handler type
 */
export type AsyncRouteHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void>;
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
    [K in keyof T]?: T[K] | {
        $or?: Array<{
            [key: string]: unknown;
        }>;
    };
} & Record<string, unknown>;
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
    errors?: Record<string, {
        message: string;
    }>;
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
export declare function isValidationError(error: unknown): error is ValidationError;
/**
 * Type guard for DuplicateKeyError
 */
export declare function isDuplicateKeyError(error: unknown): error is DuplicateKeyError;
/**
 * Type guard for UserJwtPayload
 */
export declare function isUserJwtPayload(decoded: string | JwtPayload): decoded is UserJwtPayload;
/**
 * Parse pagination query parameters
 */
export declare function parsePaginationQuery(query: PaginationQuery): ParsedPagination;
/**
 * Safe string conversion for query parameters
 */
export declare function safeStringQuery(value: string | string[] | ParsedQs | ParsedQs[] | undefined, defaultValue?: string): string;
/**
 * Safe number conversion for query parameters
 */
export declare function safeNumberQuery(value: string | string[] | undefined, defaultValue?: number): number;
//# sourceMappingURL=common.d.ts.map