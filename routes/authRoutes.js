const express = require("express");

const {

  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  me,

} = require("../controllers/authController");

const {

  validateRegister,
  validateLogin,

} = require("../validators/authValidator");

const verifyAccessToken = require("../middlewares/verifyAccessToken");

const router = express.Router();

/* ============================================================
   PUBLIC ROUTES
============================================================ */

// Register
router.post(
  "/register",
  validateRegister,
  register
);

// Verify Email
router.get(
  "/verify-email",
  verifyEmail
);

// Resend Verification Email
router.post(
  "/resend-verification",
  resendVerification
);

// Login
router.post(
  "/login",
  validateLogin,
  login
);

// Refresh Access Token
router.post(
  "/refresh",
  refresh
);

// Forgot Password
router.post(
  "/forgot-password",
  forgotPassword
);

// Reset Password
router.post(
  "/reset-password",
  resetPassword
);

/* ============================================================
   PROTECTED ROUTES
============================================================ */

// Current User
router.get(
  "/me",
  verifyAccessToken,
  me
);

// Logout
router.post(
  "/logout",
  verifyAccessToken,
  logout
);

// Logout All Devices
router.post(
  "/logout-all",
  verifyAccessToken,
  logoutAll
);

module.exports = router;