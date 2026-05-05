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

router.post("/signup", validateSignup, signUp);
router.post("/login", validateLogin, login);
router.post("/logout", requireAuth, logout); // 🔥 protected now
router.get("/me", requireAuth, me);

module.exports = router;