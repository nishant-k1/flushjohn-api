import { Request, Response, NextFunction } from "express";
/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and adds user information to the request
 */
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Optional Authentication Middleware
 * Similar to authenticateToken but doesn't require authentication
 * If token is provided, it will be verified and user info added to request
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Role-based Authorization Middleware
 * Must be used after authenticateToken middleware
 */
export declare const authorizeRoles: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Admin-only Authorization Middleware
 * Must be used after authenticateToken middleware
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Self or Admin Authorization Middleware
 * Allows access if user is accessing their own data or is an admin
 * Must be used after authenticateToken middleware
 */
export declare const selfOrAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Document Access Check Middleware
 * Checks if user has permission to access specific document types
 * Must be used after authenticateToken middleware
 */
export declare const checkDocumentAccess: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map