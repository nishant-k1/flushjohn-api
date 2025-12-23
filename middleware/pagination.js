/**
 * Pagination middleware to enforce consistent limits
 */

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

/**
 * Middleware to validate and normalize pagination parameters
 */
export const paginationMiddleware = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT)
  );

  // Normalize pagination params
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };

  // Override query params with normalized values
  req.query.page = page;
  req.query.limit = limit;

  next();
};

/**
 * Validate pagination parameters (returns errors array)
 */
export const validatePagination = (page, limit) => {
  const errors = [];

  if (isNaN(page) || page < 1) {
    errors.push("Page must be a positive integer");
  }

  if (isNaN(limit) || limit < 1) {
    errors.push("Limit must be a positive integer");
  }

  if (limit > MAX_LIMIT) {
    errors.push(`Limit cannot exceed ${MAX_LIMIT}`);
  }

  return errors;
};

