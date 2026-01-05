import { Request, Response, NextFunction } from "express";
/**
 * Generate a CSRF token for the session
 */
export declare const generateCsrfToken: (req: Request, res: Response) => string;
/**
 * Validate CSRF token from request
 */
export declare const validateCsrfToken: (req: Request) => boolean;
/**
 * CSRF Protection Middleware
 * Generates tokens for GET requests and validates for state-changing requests
 */
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional CSRF token generation endpoint
 * Allows frontend to fetch a new CSRF token
 */
export declare const getCsrfToken: (req: Request, res: Response) => void;
//# sourceMappingURL=csrf.d.ts.map