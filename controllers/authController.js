const bcrypt = require("bcrypt");


const asyncHandler = require("../utils/asyncHandler");


const {
  findUserByEmail,
  createUser,
} = require("../models/userModel");




/* -------------------- SIGN UP -------------------- */
exports.signUp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const err = new Error("All fields are required");
    err.status = 400;
    throw err;
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const err = new Error("User already exists");
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    role: "student",
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user,
  });
});



/* -------------------- LOGIN -------------------- */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = new Error("Email and password required");
    err.status = 400;
    throw err;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  req.session.regenerate(err => {
    if (err) {
      throw err;
    }

    req.session.user = {
      id: user.id,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        role: user.role,
      },
    });
  });
});



/* -------------------- LOGOUT -------------------- */
exports.logout = asyncHandler(async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(200).json({
      success: true,
      message: "Already logged out",
      user: null,
    });
  }

  const user = { ...req.session.user };

  req.session.destroy(err => {
    if (err) {
      throw err;
    }

    res.clearCookie("campus.sid");
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
      user,
    });
  });
});
