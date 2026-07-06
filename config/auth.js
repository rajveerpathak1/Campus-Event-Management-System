require("dotenv").config();

module.exports = {

  accessTokenExpiry:
    process.env.JWT_ACCESS_EXPIRES || "15m",

  refreshTokenExpiry:
    process.env.JWT_REFRESH_EXPIRES || "7d",

  refreshCookieMaxAge:
    7 * 24 * 60 * 60 * 1000,

};