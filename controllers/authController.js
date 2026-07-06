const crypto = require("crypto");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const {
  findUserByEmail,
  createUser,
  storeEmailVerificationToken,
  verifyEmailUser,
    deleteEmailVerificationToken,
    storeRefreshToken,
} = require("../models/authModel");

const {
  generateEmailVerificationToken,
} = require("../services/tokenService");

const {
  sendVerificationEmail,
} = require("../services/emailService");


const {
    generateAccessToken,
    generateRefreshToken,
} = require("../utils/jwt");

const {
    hashToken,
} = require("../utils/token");

const {
    REFRESH_COOKIE_OPTIONS,
} = require("../utils/constants");








const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
  } = req.body;

  /* ---------------------------- */
  /* Check existing user          */
  /* ---------------------------- */

  const existingUser =
    await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(
      409,
      "Email already registered."
    );
  }

  /* ---------------------------- */
  /* Create user                  */
  /* ---------------------------- */

  const user = await createUser({
    name,
    email,
    password,
  });

  /* ---------------------------- */
  /* Email verification token     */
  /* ---------------------------- */

  const verificationToken =
    generateEmailVerificationToken();

  const tokenHash = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24
  );

  await storeEmailVerificationToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  /* ---------------------------- */
  /* Send email                   */
  /* ---------------------------- */

  await sendVerificationEmail({
    email: user.email,
    name: user.name,
    token: verificationToken,
  });

  /* ---------------------------- */

  res.status(201).json({
    success: true,
    message:
      "Registration successful. Please verify your email.",
  });
});

module.exports = {
  register,
};


const verifyEmail = asyncHandler(async (req, res) => {

    const { token } = req.body;

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await verifyEmailUser(tokenHash);

    if (!user) {
        throw new ApiError(
            400,
            "Invalid or expired verification link."
        );
    }

    await deleteEmailVerificationToken(user.id);

    const accessToken =
        generateAccessToken(user);

    const refreshToken =
        generateRefreshToken(user);

    await storeRefreshToken({

        userId: user.id,

        tokenHash: hashToken(refreshToken),

        expiresAt: new Date(
            Date.now() +
            1000 *
            60 *
            60 *
            24 *
            30
        )

    });

    res.cookie(
        "refreshToken",
        refreshToken,
        REFRESH_COOKIE_OPTIONS
    );

    return res.status(200).json({

        success: true,

        message:
            "Email verified successfully.",

        accessToken,

        user: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role

        }

    });

});

