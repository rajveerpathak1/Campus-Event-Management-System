const ApiError = require("../utils/ApiError");

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next(new ApiError(401, "Unauthorized - Please login"));
  }

  // Attach user to request
  req.user = req.session.user;

  next();
};

module.exports = requireAuth;