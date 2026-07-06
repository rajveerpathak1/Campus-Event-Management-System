const jwt = require("jsonwebtoken");

const authConfig = require("../config/auth");
const jwtConfig = require("../config/jwt");
/* =====================================================
   Generate Access Token
===================================================== */

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: "access",
    },
    jwtConfig.accessSecret,
    {
      expiresIn: jwtConfig.accessExpiry,
    }
  );
};

/* =====================================================
   Generate Refresh Token
===================================================== */

const generateRefreshToken = (user, tokenId) => {
  return jwt.sign(
    {
      sub: user.id,
      jti: tokenId,
      type: "refresh",
    },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiry,
    }
  );
};

/* =====================================================
   Verify Access Token
===================================================== */

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    jwtConfig.accessSecret
  );
};

/* =====================================================
   Verify Refresh Token
===================================================== */

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    jwtConfig.refreshSecret
  );
};

/* =====================================================
   Cookie Options
===================================================== */

const refreshCookieOptions = {
  httpOnly: true,

  secure:
    process.env.NODE_ENV === "production",

  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",

  path: "/api/v1/auth/refresh",

  maxAge:
    7 * 24 * 60 * 60 * 1000,
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshCookieOptions,
};