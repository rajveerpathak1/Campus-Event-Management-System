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
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, and password are required");
  }

  //  normalize email
  email = email.toLowerCase().trim();

  //  password strength check
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
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
    data: user,
  });
});

/* -------------------- LOGIN -------------------- */
exports.login = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  email = email.toLowerCase().trim();

  const user = await findUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  if (!req.session) {
    throw new ApiError(500, "Session not initialized");
  }

  // regenerate session (prevent fixation)
  await new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) return reject(err);

      req.session.user = {
        id: user.id,
        role: user.role,
      };

      req.session.save(err => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* -------------------- LOGOUT -------------------- */
exports.logout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (!req.session || !req.session.user) {
    return res.status(200).json({
      success: true,
      message: "Already logged out",
    });
  }

  await new Promise((resolve, reject) => {
    req.session.destroy(err => {
      if (err) return reject(err);
      resolve();
    });
  });

  res.clearCookie("campus.sid", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
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
    data: user,
  });
});