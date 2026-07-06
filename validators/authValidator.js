const ApiError = require("../utils/ApiError");

/* ================================================= */
/* HELPERS */
/* ================================================= */

const isEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "").trim()
  );

/* ================================================= */
/* REGISTER */
/* ================================================= */

const validateRegister = (req, res, next) => {
  const {
    name,
    email,
    password,
  } = req.body || {};

  if (!name || !email || !password) {
    return next(
      new ApiError(
        400,
        "Name, email and password are required."
      )
    );
  }

  if (name.trim().length < 2) {
    return next(
      new ApiError(
        400,
        "Name must contain at least 2 characters."
      )
    );
  }

  if (!isEmail(email)) {
    return next(
      new ApiError(
        400,
        "Invalid email address."
      )
    );
  }

  if (password.length < 8) {
    return next(
      new ApiError(
        400,
        "Password must be at least 8 characters."
      )
    );
  }

  next();
};

/* ================================================= */
/* LOGIN */
/* ================================================= */

const validateLogin = (req, res, next) => {
  const {
    email,
    password,
  } = req.body || {};

  if (!email || !password) {
    return next(
      new ApiError(
        400,
        "Email and password are required."
      )
    );
  }

  if (!isEmail(email)) {
    return next(
      new ApiError(
        400,
        "Invalid email address."
      )
    );
  }

  next();
};

/* ================================================= */
/* VERIFY EMAIL */
/* ================================================= */

const validateVerifyEmail = (
  req,
  res,
  next
) => {
  const { token } = req.body || {};

  if (!token) {
    return next(
      new ApiError(
        400,
        "Verification token is required."
      )
    );
  }

  next();
};

/* ================================================= */
/* FORGOT PASSWORD */
/* ================================================= */

const validateForgotPassword = (
  req,
  res,
  next
) => {
  const { email } = req.body || {};

  if (!email) {
    return next(
      new ApiError(
        400,
        "Email is required."
      )
    );
  }

  if (!isEmail(email)) {
    return next(
      new ApiError(
        400,
        "Invalid email address."
      )
    );
  }

  next();
};

/* ================================================= */
/* RESET PASSWORD */
/* ================================================= */

const validateResetPassword = (
  req,
  res,
  next
) => {
  const {
    token,
    password,
  } = req.body || {};

  if (!token || !password) {
    return next(
      new ApiError(
        400,
        "Token and password are required."
      )
    );
  }

  if (password.length < 8) {
    return next(
      new ApiError(
        400,
        "Password must be at least 8 characters."
      )
    );
  }

  next();
};

/* ================================================= */
/* CHANGE PASSWORD */
/* ================================================= */

const validateChangePassword = (
  req,
  res,
  next
) => {
  const {
    currentPassword,
    newPassword,
  } = req.body || {};

  if (
    !currentPassword ||
    !newPassword
  ) {
    return next(
      new ApiError(
        400,
        "Current password and new password are required."
      )
    );
  }

  if (newPassword.length < 8) {
    return next(
      new ApiError(
        400,
        "New password must be at least 8 characters."
      )
    );
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
};