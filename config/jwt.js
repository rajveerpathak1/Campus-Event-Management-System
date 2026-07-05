require("dotenv").config();

module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET,

  refreshSecret: process.env.JWT_REFRESH_SECRET,

  accessExpiry:
    process.env.JWT_ACCESS_EXPIRES || "15m",

  refreshExpiry:
    process.env.JWT_REFRESH_EXPIRES || "7d",
};