/**
 * Lead Validation Rules
 * Using express-validator for comprehensive input validation
 */
/**
 * Validate lead creation
 */
export declare const validateCreateLead: import("express-validator").ValidationChain[];
/**
 * Validate lead update
 */
export declare const validateUpdateLead: import("express-validator").ValidationChain[];
/**
 * Validate lead ID parameter
 */
export declare const validateLeadId: import("express-validator").ValidationChain[];
/**
 * Validate pagination parameters
 */
export declare const validateGetLeads: import("express-validator").ValidationChain[];
/**
 * Middleware to handle validation errors
 */
export declare const handleValidationErrors: (req: any, res: any, next: any) => any;
//# sourceMappingURL=leadValidator.d.ts.map