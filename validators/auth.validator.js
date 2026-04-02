const ApiError = require("../utils/ApiError");

const isEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return next(new ApiError(400, "name, email, and password are required"));
  }

  if (!isEmail(email)) {
    return next(new ApiError(400, "Invalid email format"));
  }

  if (String(password).length < 6) {
    return next(new ApiError(400, "Password must be at least 6 characters"));
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return next(new ApiError(400, "email and password are required"));
  }

  if (!isEmail(email)) {
    return next(new ApiError(400, "Invalid email format"));
  }

  next();
};

module.exports = {
  validateSignup,
  validateLogin,
};

