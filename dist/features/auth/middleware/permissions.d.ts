/**
 * Role-Based Access Control (RBAC) Permissions
 * Granular permission checking for CRM resources
 */
export declare const ROLES: {
    ADMIN: string;
    MANAGER: string;
    USER: string;
};
export declare const RESOURCES: {
    LEADS: string;
    QUOTES: string;
    SALES_ORDERS: string;
    JOB_ORDERS: string;
    CUSTOMERS: string;
    VENDORS: string;
    BLOGS: string;
    DASHBOARD: string;
    USERS: string;
    REPORTS: string;
    CONTACTS: string;
};
export declare const ACTIONS: {
    CREATE: string;
    READ: string;
    UPDATE: string;
    DELETE: string;
    MANAGE: string;
    EXPORT: string;
    VIEW_REPORTS: string;
};
/**
 * Check if user has permission for resource and action
 */
export declare const hasPermission: (role: any, resource: any, action: any) => boolean;
/**
 * Middleware to check permission
 * Usage: checkPermission(RESOURCES.LEADS, ACTIONS.CREATE)
 */
export declare const checkPermission: (resource: any, action: any) => (req: any, res: any, next: any) => any;
/**
 * Helper: Check if user can manage resource
 */
export declare const canManage: (resource: any) => (req: any, res: any, next: any) => any;
/**
 * Helper: Check if user can create resource
 */
export declare const canCreate: (resource: any) => (req: any, res: any, next: any) => any;
/**
 * Helper: Check if user can read resource
 */
export declare const canRead: (resource: any) => (req: any, res: any, next: any) => any;
/**
 * Helper: Check if user can update resource
 */
export declare const canUpdate: (resource: any) => (req: any, res: any, next: any) => any;
/**
 * Helper: Check if user can delete resource
 */
export declare const canDelete: (resource: any) => (req: any, res: any, next: any) => any;
/**
 * Multi-resource permission check
 * Usage: checkMultiplePermissions([RESOURCES.LEADS, RESOURCES.QUOTES], ACTIONS.READ)
 */
export declare const checkMultiplePermissions: (resources: any, action: any) => (req: any, res: any, next: any) => any;
/**
 * Get user's permissions (for frontend)
 */
export declare const getUserPermissions: (role: any) => {
    [RESOURCES.LEADS]: string[];
    [RESOURCES.QUOTES]: string[];
    [RESOURCES.SALES_ORDERS]: string[];
    [RESOURCES.JOB_ORDERS]: string[];
    [RESOURCES.CUSTOMERS]: string[];
    [RESOURCES.VENDORS]: string[];
    [RESOURCES.BLOGS]: string[];
    [RESOURCES.DASHBOARD]: string[];
    [RESOURCES.USERS]: string[];
    [RESOURCES.REPORTS]: string[];
    [RESOURCES.CONTACTS]: string[];
};
//# sourceMappingURL=permissions.d.ts.map