const express = require("express");


const {
  signUp,
  login,
  logout,
} = require("../controllers/authController");


const {
  validateSignup,
  validateLogin,
} = require("../validators/auth.validator");


const requireAuth = require("../middlewares/requireAuth");


const { me } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", validateSignup, signUp);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.get("/me", requireAuth, me); // check this later 

module.exports = router;
