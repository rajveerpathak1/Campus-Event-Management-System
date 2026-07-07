require("dotenv").config();

module.exports = {

  /* ===========================================
     Access Token
  =========================================== */

  accessTokenExpiry:
    process.env.JWT_ACCESS_EXPIRES || "15m",

  /* ===========================================
     Refresh Token
  =========================================== */

  refreshTokenExpiry:
    process.env.JWT_REFRESH_EXPIRES || "7d",

  /* ===========================================
     Email Verification
  =========================================== */

  emailVerificationExpiry:
    24 * 60 * 60 * 1000,

  /* ===========================================
     Password Reset
  =========================================== */

  passwordResetExpiry:
    15 * 60 * 1000,

  /* ===========================================
     Cookies
  =========================================== */

  refreshCookieName:
    "refreshToken",

  refreshCookieMaxAge:
    7 * 24 * 60 * 60 * 1000,

  /* ===========================================
     Frontend
  =========================================== */

  frontendUrl:
    process.env.CLIENT_URL,

    backendUrl:
process.env.BACKEND_URL,

};