const ApiError = require("../utils/ApiError");

/**
 * Role hierarchy (expandable)
 * super-admin > admin > student
 */
const roleHierarchy = {
  "super-admin": 3,
  "admin": 2,
  "student": 1,
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    const userRole = req.user.role;

    if (!roleHierarchy[userRole]) {
      return next(new ApiError(403, "Invalid role"));
    }

    const hasAccess = allowedRoles.some(
      (role) =>
        roleHierarchy[userRole] >= roleHierarchy[role]
    );

    if (!hasAccess) {
      return next(new ApiError(403, "Access denied"));
    }

    next();
  };
};

module.exports = { authorizeRoles };