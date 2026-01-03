/**
 * Middleware to validate and recalculate product amounts
 * Ensures financial accuracy by server-side verification
 */
import { Request, Response, NextFunction } from "express";
declare const validateAndRecalculateProducts: (req: Request, res: Response, next: NextFunction) => void;
export default validateAndRecalculateProducts;
//# sourceMappingURL=validateProducts.d.ts.map