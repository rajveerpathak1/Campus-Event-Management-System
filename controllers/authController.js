const crypto = require("crypto");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const authConfig = require("../config/auth");

const {
    hashPassword,
    verifyPassword,
} = require("../utils/hash");

const {
    generateRandomToken,
    hashToken,
} = require("../utils/token");

const {
  getRefreshCookieOptions,
  getClearRefreshCookieOptions,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateDeviceId,
  
} = require("../services/tokenService");



const {
    sendVerificationEmail,
    sendPasswordResetEmail,
} = require("../services/emailService");

const {

    createUser,

    findUserByEmail,

    findUserById,

    updateLastLogin,

    markEmailVerified,

    storeRefreshToken,

    findRefreshToken,

    revokeRefreshToken,

    revokeAllRefreshTokens,

    storeVerificationToken,

    findVerificationToken,

    findVerificationTokenWithUser,

    deleteVerificationToken,

    storePasswordResetToken,

    findPasswordResetToken,

    markPasswordResetTokenUsed,

    updatePassword,
    revokeRefreshTokenByHash,
    findRefreshTokenWithUser,

} = require("../models/authModel");



/* ============================================================
   REGISTER
============================================================ */

const register = asyncHandler(async (req, res) => {

    const {

        name,

        email,

        password,

    } = req.body;

    const existing =
        await findUserByEmail(email);

    if (existing) {

        throw new ApiError(
            409,
            "Email already registered."
        );

    }

    const passwordHash =
        await hashPassword(password);

    const user =
        await createUser({

            name,

            email,

            passwordHash,

            role: "student",

        });

    const rawToken =
        generateRandomToken();

    await storeVerificationToken({

        userId: user.id,

        tokenHash: hashToken(rawToken),

        expiresAt: new Date(

            Date.now()

            +

            authConfig.emailVerificationExpiry

        ),

    });

    const verificationUrl =

`${authConfig.frontendUrl}/verify-email?token=${rawToken}`;

    await sendVerificationEmail({

        email: user.email,

        name: user.name,

        verificationUrl,

    });

    res.status(201).json({

        success: true,

        message:

"Registration successful. Please verify your email."

    });

});


/* ============================================================
   VERIFY EMAIL
============================================================ */

const verifyEmail = asyncHandler(async (req, res) => {

    const { token } = req.query;

    if (!token) {

        throw new ApiError(
            400,
            "Verification token missing."
        );

    }

    const tokenHash =
        hashToken(token);

    const verification =
        await findVerificationTokenWithUser(
            tokenHash
        );

    if (!verification) {

        throw new ApiError(
            400,
            "Invalid or expired verification link."
        );

    }

    await markEmailVerified(
        verification.user_id
    );

    await deleteVerificationToken(
        verification.user_id
    );

    res.status(200).json({

        success: true,

        message:
"Email verified successfully. Please login."

    });

});


/* ============================================================
   RESEND VERIFICATION EMAIL
============================================================ */

const resendVerification =
asyncHandler(async (req, res) => {

    const { email } = req.body;

    const user =
        await findUserByEmail(email);

    if (!user) {

        throw new ApiError(
            404,
            "User not found."
        );

    }

    if (user.email_verified_at) {

        throw new ApiError(
            400,
            "Email already verified."
        );

    }

    const rawToken =
        generateRandomToken();

    await storeVerificationToken({

        userId: user.id,

        tokenHash:
            hashToken(rawToken),

        expiresAt:
            new Date(

                Date.now()

                +

                authConfig.emailVerificationExpiry

            ),

    });

    const verificationUrl =

`${authConfig.frontendUrl}/verify-email?token=${rawToken}`;

    await sendVerificationEmail({

        email: user.email,

        name: user.name,

        verificationUrl,

    });

    res.json({

        success: true,

        message:
"Verification email sent."

    });

});



/* ============================================================
   LOGIN
============================================================ */

const login = asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValidPassword = await verifyPassword(
    user.password_hash,
    password
  );

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.email_verified_at) {
    throw new ApiError(
      403,
      "Please verify your email before logging in."
    );
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken({ userId: user.id,});

  await storeRefreshToken({

    userId: user.id,

    tokenHash: hashToken(refreshToken),

    deviceId: generateDeviceId(),

    deviceName:
      req.headers["sec-ch-ua-platform"] ||
      "Unknown Device",

    userAgent:
      req.headers["user-agent"] || null,

    ipAddress:
      req.ip || null,

    expiresAt: new Date(
      Date.now() +
      7 * 24 * 60 * 60 * 1000
    ),

  });

  await updateLastLogin(user.id);

  res.cookie(
    "refreshToken",
    refreshToken,
    getRefreshCookieOptions()
  );

  res.status(200).json({

    success: true,

    accessToken,

    user: {

      id: user.id,

      name: user.name,

      email: user.email,

      role: user.role,

    },

  });

});


/* ============================================================
   REFRESH TOKEN
============================================================ */

const refresh = asyncHandler(async (req, res) => {

  const refreshToken =
    req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token missing."
    );
  }

  let payload;

  try {

    payload =
      verifyRefreshToken(refreshToken);

  } catch {

    throw new ApiError(
      401,
      "Invalid refresh token."
    );

  }

  const tokenHash =
    hashToken(refreshToken);

  const tokenRecord =
    await findRefreshTokenWithUser(
      tokenHash
    );

  if (!tokenRecord) {

    throw new ApiError(
      401,
      "Refresh token revoked or expired."
    );

  }

  await revokeRefreshToken(tokenRecord.refresh_token_id);

  const newAccessToken =
    generateAccessToken({id: tokenRecord.user_id,
    email: tokenRecord.email,
    role: tokenRecord.role,});

  const newRefreshToken =
    generateRefreshToken({ userId: tokenRecord.user_id,});

  await storeRefreshToken({

    userId:
      tokenRecord.user_id,

    tokenHash:
      hashToken(newRefreshToken),

    deviceId:
      tokenRecord.device_id,

    deviceName:
      tokenRecord.device_name,

    userAgent:
      tokenRecord.user_agent,

    ipAddress:
      tokenRecord.ip_address,

    expiresAt:
      new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      ),

  });

  res.cookie(

    "refreshToken",

    newRefreshToken,

    getRefreshCookieOptions()

  );

  res.json({

    success: true,

    accessToken:
      newAccessToken,

  });

});


/* ============================================================
   LOGOUT
============================================================ */

const logout = asyncHandler(async (req, res) => {

  const refreshToken =
    req.cookies?.refreshToken;

  if (refreshToken) {

    await revokeRefreshTokenByHash(

      hashToken(refreshToken)

    );

  }

  res.clearCookie(

    "refreshToken",

    getClearRefreshCookieOptions()

  );

  res.json({

    success: true,

    message:
      "Logged out successfully.",

  });

});



/* ============================================================
   LOGOUT ALL DEVICES
============================================================ */

const logoutAll = asyncHandler(async (req, res) => {

  await revokeAllRefreshTokens(
    req.user.id
  );

  res.clearCookie(

    "refreshToken",

    getClearRefreshCookieOptions()

  );

  res.json({

    success: true,

    message:
      "Logged out from all devices.",

  });

});



/* ============================================================
   FORGOT PASSWORD
============================================================ */

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    const user = await findUserByEmail(email);

    /**
     * Never reveal whether email exists
     */

    if (!user) {

        return res.json({

            success: true,

            message:
                "If the account exists, a reset email has been sent."

        });

    }

    const rawToken =
        generateRandomToken();

    await storePasswordResetToken({

        userId: user.id,

        tokenHash:
            hashToken(rawToken),

        expiresAt:

            new Date(

                Date.now()

                +

                authConfig.passwordResetExpiry

            ),

    });

    const resetUrl =

`${authConfig.frontendUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({

        email: user.email,

        name: user.name,

        resetUrl,

    });

    res.json({

        success: true,

        message:
            "If the account exists, a reset email has been sent."

    });

});

/* ============================================================
   RESET PASSWORD
============================================================ */

const resetPassword = asyncHandler(async (req, res) => {

    const {

        token,

        password,

    } = req.body;

    const tokenHash =
        hashToken(token);

    const resetToken =
        await findPasswordResetToken(
            tokenHash
        );

    if (!resetToken) {

        throw new ApiError(

            400,

            "Invalid or expired reset token."

        );

    }

    const passwordHash =
        await hashPassword(password);

    await updatePassword({

        userId:
            resetToken.user_id,

        passwordHash,

    });

    await markPasswordResetTokenUsed(

        resetToken.user_id

    );

    await revokeAllRefreshTokens(

        resetToken.user_id

    );

    res.json({

        success: true,

        message:
            "Password reset successful. Please login."

    });

});

/* ============================================================
   CURRENT USER
============================================================ */

const me = asyncHandler(async (req, res) => {

    const user =
        await findUserById(req.user.id);

    if (!user) {

        throw new ApiError(

            404,

            "User not found."

        );

    }

    res.json({

        success: true,

        data: {

            id: user.id,

            name: user.name,

            email: user.email,

            role: user.role,

            emailVerified:
                !!user.email_verified_at,

            createdAt:
                user.created_at,

            lastLogin:
                user.last_login,

        }

    });

});

module.exports = {

    register,

    verifyEmail,

    resendVerification,

    login,

    refresh,

    logout,

    logoutAll,

    forgotPassword,

    resetPassword,

    me,

};