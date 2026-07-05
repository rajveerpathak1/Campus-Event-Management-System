const crypto = require("crypto");

/**
 * Generate secure random token
 */
const generateRandomToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

/**
 * Hash token before DB storage
 */
const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

module.exports = {
  generateRandomToken,
  hashToken,
};