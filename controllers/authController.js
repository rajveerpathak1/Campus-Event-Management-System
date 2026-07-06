const crypto = require("crypto");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const {
    hashPassword,
    verifyPassword,
} = require("../utils/hash");

const {
    generateRandomToken,
    hashToken,
} = require("../utils/token");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    refreshCookieOptions,
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

    deleteVerificationToken,

    storePasswordResetToken,

    findPasswordResetToken,

    markPasswordResetTokenUsed,

} = require("../models/authModel");




