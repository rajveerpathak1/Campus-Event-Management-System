const argon2 = require("argon2");

/**
 * Hash password
 */
const hashPassword = async (password) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
  });
};

/**
 * Verify password
 */
const verifyPassword = async (
  hash,
  password
) => {
  return await argon2.verify(
    hash,
    password
  );
};

module.exports = {
  hashPassword,
  verifyPassword,
};