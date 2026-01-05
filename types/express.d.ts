import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email?: string;
        fName?: string;
        lName?: string;
        role?: string;
        isActive?: boolean;
      };
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
      productValidation?: {
        hasDiscrepancy: boolean;
        discrepancies: Array<{
          index: number;
          item: string;
          qty: number;
          rate: number;
          frontendAmount: number;
          serverAmount: number;
          difference: number;
        }>;
        productCount: number;
        totalAmount: string;
      };
    }
  }
}

export {};
