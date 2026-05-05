const ApiError = require("../utils/ApiError");

module.exports = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next(new ApiError(401, "Unauthorized"));
  }

  req.user = req.session.user;
  next();
};