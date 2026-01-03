/**
 * Role-Based Access Control (RBAC) Permissions
 * Granular permission checking for CRM resources
 */

// Define roles
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
};

// Define resources (what can be accessed)
export const RESOURCES = {
  LEADS: "leads",
  QUOTES: "quotes",
  SALES_ORDERS: "sales_orders",
  JOB_ORDERS: "job_orders",
  CUSTOMERS: "customers",
  VENDORS: "vendors",
  BLOGS: "blogs",
  DASHBOARD: "dashboard",
  USERS: "users",
  REPORTS: "reports",
  CONTACTS: "contacts",
};

// Define actions (what can be done)
export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage", // Full CRUD
  EXPORT: "export",
  VIEW_REPORTS: "view_reports",
};

// Define permissions matrix
// Format: role -> resource -> actions[]
const PERMISSIONS = {
  [ROLES.ADMIN]: {
    [RESOURCES.LEADS]: [ACTIONS.MANAGE],
    [RESOURCES.QUOTES]: [ACTIONS.MANAGE],
    [RESOURCES.SALES_ORDERS]: [ACTIONS.MANAGE],
    [RESOURCES.JOB_ORDERS]: [ACTIONS.MANAGE],
    [RESOURCES.CUSTOMERS]: [ACTIONS.MANAGE],
    [RESOURCES.VENDORS]: [ACTIONS.MANAGE],
    [RESOURCES.BLOGS]: [ACTIONS.MANAGE],
    [RESOURCES.DASHBOARD]: [ACTIONS.READ],
    [RESOURCES.USERS]: [ACTIONS.MANAGE],
    [RESOURCES.REPORTS]: [ACTIONS.VIEW_REPORTS, ACTIONS.EXPORT],
    [RESOURCES.CONTACTS]: [ACTIONS.MANAGE],
  },
  [ROLES.MANAGER]: {
    [RESOURCES.LEADS]: [ACTIONS.MANAGE],
    [RESOURCES.QUOTES]: [ACTIONS.MANAGE],
    [RESOURCES.SALES_ORDERS]: [ACTIONS.MANAGE],
    [RESOURCES.JOB_ORDERS]: [ACTIONS.MANAGE],
    [RESOURCES.CUSTOMERS]: [ACTIONS.MANAGE],
    [RESOURCES.VENDORS]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.BLOGS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE],
    [RESOURCES.DASHBOARD]: [ACTIONS.READ],
    [RESOURCES.USERS]: [ACTIONS.READ],
    [RESOURCES.REPORTS]: [ACTIONS.VIEW_REPORTS, ACTIONS.EXPORT],
    [RESOURCES.CONTACTS]: [ACTIONS.MANAGE],
  },
  [ROLES.USER]: {
    [RESOURCES.LEADS]: [ACTIONS.READ],
    [RESOURCES.QUOTES]: [ACTIONS.READ],
    [RESOURCES.SALES_ORDERS]: [ACTIONS.READ],
    [RESOURCES.JOB_ORDERS]: [ACTIONS.READ],
    [RESOURCES.CUSTOMERS]: [ACTIONS.READ],
    [RESOURCES.VENDORS]: [ACTIONS.READ],
    [RESOURCES.BLOGS]: [ACTIONS.READ],
    [RESOURCES.DASHBOARD]: [ACTIONS.READ],
    [RESOURCES.USERS]: [],
    [RESOURCES.REPORTS]: [],
    [RESOURCES.CONTACTS]: [ACTIONS.READ],
  },
};

/**
 * Check if user has permission for resource and action
 */
export const hasPermission = (role, resource, action) => {
  // Admin has all permissions
  if (role === ROLES.ADMIN) {
    return true;
  }

  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  // Check if action is allowed
  return (
    resourcePermissions.includes(action) ||
    resourcePermissions.includes(ACTIONS.MANAGE)
  );
};

/**
 * Middleware to check permission
 * Usage: checkPermission(RESOURCES.LEADS, ACTIONS.CREATE)
 */
export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    const userRole = req.user.role;
    const hasAccess = hasPermission(userRole, resource, action);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to ${action} ${resource}.`,
        error: "FORBIDDEN",
        requiredPermission: `${resource}:${action}`,
        userRole: userRole,
      });
    }

    next();
  };
};

/**
 * Helper: Check if user can manage resource
 */
export const canManage = (resource) => {
  return checkPermission(resource, ACTIONS.MANAGE);
};

/**
 * Helper: Check if user can create resource
 */
export const canCreate = (resource) => {
  return checkPermission(resource, ACTIONS.CREATE);
};

/**
 * Helper: Check if user can read resource
 */
export const canRead = (resource) => {
  return checkPermission(resource, ACTIONS.READ);
};

/**
 * Helper: Check if user can update resource
 */
export const canUpdate = (resource) => {
  return checkPermission(resource, ACTIONS.UPDATE);
};

/**
 * Helper: Check if user can delete resource
 */
export const canDelete = (resource) => {
  return checkPermission(resource, ACTIONS.DELETE);
};

/**
 * Multi-resource permission check
 * Usage: checkMultiplePermissions([RESOURCES.LEADS, RESOURCES.QUOTES], ACTIONS.READ)
 */
export const checkMultiplePermissions = (resources, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
    }

    const userRole = req.user.role;
    const hasAccess = resources.some((resource) =>
      hasPermission(userRole, resource, action)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Insufficient permissions.`,
        error: "FORBIDDEN",
        userRole: userRole,
      });
    }

    next();
  };
};

/**
 * Get user's permissions (for frontend)
 */
export const getUserPermissions = (role) => {
  const rolePermissions = PERMISSIONS[role] || {};
  return rolePermissions;
};
