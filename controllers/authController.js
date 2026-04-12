const bcrypt = require("bcrypt");
const asyncHandler = require("../utils/asyncHandler");

const {
  findUserByEmail,
  createUser,
  findUserById,
} = require("../models/userModel");

const ApiError = require("../utils/ApiError");

/* -------------------- SIGN UP -------------------- */
exports.signUp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, and password are required");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    role: "student",
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* -------------------- LOGIN -------------------- */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  // 🔥 Step 1: destroy old session FIRST (important)
  await new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) return reject(err);
      resolve();
    });
  });

  // 🔥 Step 2: set user
  req.session.user = {
    id: user.id,
    role: user.role,
  };

  // 🔥 Step 3: save session
  await new Promise((resolve, reject) => {
    req.session.save(err => {
      if (err) return reject(err);
      resolve();
    });
  });

  // 🔥 Step 4: FORCE COOKIE SET (THIS WAS MISSING)
  res.cookie("campus.sid", req.sessionID, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: req.session.user,
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

  await new Promise((resolve, reject) => {
    req.session.destroy(err => {
      if (err) return reject(err);
      resolve();
    });
  });

  res.clearCookie("campus.sid", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
    user,
  });
});

/* -------------------- GET ME -------------------- */
exports.me = asyncHandler(async (req, res) => {
  const sessionUser = req.user;

  if (!sessionUser?.id) {
    throw new ApiError(401, "Not authenticated");
  }

  const user = await findUserById(sessionUser.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});