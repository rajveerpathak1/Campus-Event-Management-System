/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

const express = require("express");

const {
  signUp,
  login,
  logout,
  me,
} = require("../controllers/authController");

const {
  validateSignup,
  validateLogin,
} = require("../validators/auth.validator");

const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();


/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
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
 *                 example: Rajveer
 *               email:
 *                 type: string
 *                 example: rajveer@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post("/signup", validateSignup, signUp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", validateLogin, login);
router.post("/logout", requireAuth, logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User data
 */
// 🔥 protected now
router.get("/me", requireAuth, me);

module.exports = router;