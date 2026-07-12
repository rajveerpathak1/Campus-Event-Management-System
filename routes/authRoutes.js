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
  validateForgotPassword,
  validateResetPassword,

} = require("../validators/authValidator");

const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and Token Management APIs
 */

/* ============================================================
   PUBLIC ROUTES
============================================================ */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rajveer Pathak
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajveer@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully. Email verification sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please verify your email.
 *       400:
 *         description: Validation error or email already exists.
 */
// Register
router.post(
  "/register",
  validateRegister,
  register
);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify user email using token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email verified successfully.
 *       400:
 *         description: Invalid or expired token.
 */
// Verify Email
router.get(
  "/verify-email",
  verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajveer@gmail.com
 *     responses:
 *       200:
 *         description: Verification email resent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Verification email sent.
 *       400:
 *         description: Email already verified or invalid user.
 */
// Resend Verification Email
router.post(
  "/resend-verification",
  validateForgotPassword,
  resendVerification
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and return JWT access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajveer@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful. Sets httpOnly refreshToken cookie.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde...; Path=/; HttpOnly; Secure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid email or password, or email not verified.
 */
// Login
router.post(
  "/login",
  validateLogin,
  login
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate and refresh JWT access token
 *     tags: [Authentication]
 *     description: Accepts refresh token from cookies (HttpOnly) or from request body fallback.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Fallback refresh token for non-cookie/mobile clients.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully. Sets new httpOnly refreshToken cookie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token missing, expired, or invalid.
 */
// Refresh Access Token
router.post(
  "/refresh",
  refresh
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajveer@gmail.com
 *     responses:
 *       200:
 *         description: Reset email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset email sent.
 */
// Forgot Password
router.post(
  "/forgot-password",
  validateForgotPassword,
  forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *                 example: abcdef123...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successfully.
 *       400:
 *         description: Invalid or expired reset token.
 */
// Reset Password
router.post(
  "/reset-password",
  validateResetPassword,
  resetPassword
);

/* ============================================================
   PROTECTED ROUTES
============================================================ */

// Current User
router.get(
  "/me",
  requireAuth,
  me
);

// Logout
router.post(
  "/logout",
  requireAuth,
  logout
);

// Logout All Devices
router.post(
  "/logout-all",
  requireAuth,
  logoutAll
);

module.exports = router;