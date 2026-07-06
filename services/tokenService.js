const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const jwtConfig = require("../config/jwt");
const authConfig = require("../config/auth");

/* =====================================================
   ACCESS TOKEN
===================================================== */

const generateAccessToken = (user) => {

    return jwt.sign(

        {

            sub: user.id,

            email: user.email,

            role: user.role,

            type: "access",

        },

        jwtConfig.accessSecret,

        {

            expiresIn:
                jwtConfig.accessExpiry,

        }

    );

};

/* =====================================================
   REFRESH TOKEN
===================================================== */

const generateRefreshToken = ({
    userId,
    tokenId,
}) => {

    return jwt.sign(

        {

            sub: userId,

            jti: tokenId,

            type: "refresh",

        },

        jwtConfig.refreshSecret,

        {

            expiresIn:
                jwtConfig.refreshExpiry,

        }

    );

};

/* =====================================================
   VERIFY ACCESS TOKEN
===================================================== */

const verifyAccessToken = (token) => {

    return jwt.verify(

        token,

        jwtConfig.accessSecret

    );

};

/* =====================================================
   VERIFY REFRESH TOKEN
===================================================== */

const verifyRefreshToken = (token) => {

    return jwt.verify(

        token,

        jwtConfig.refreshSecret

    );

};

/* =====================================================
   DECODE TOKEN
===================================================== */

const decodeToken = (token) => {

    return jwt.decode(token);

};

/* =====================================================
   AUTH HEADER
===================================================== */

const extractBearerToken = (req) => {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return null;

    }

    if (
        !authHeader.startsWith("Bearer ")
    ) {

        return null;

    }

    return authHeader.split(" ")[1];

};

/* =====================================================
   DEVICE ID
===================================================== */

const generateDeviceId = () => {

    return crypto.randomUUID();

};

/* =====================================================
   COOKIE OPTIONS
===================================================== */

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: authConfig.refreshCookieMaxAge,
  path: "/api/v1/auth/refresh",
});

/* =====================================================
   CLEAR COOKIE
===================================================== */

const getClearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth/refresh",
});

module.exports = {

    generateAccessToken,

    generateRefreshToken,

    verifyAccessToken,

    verifyRefreshToken,

    decodeToken,

    extractBearerToken,

    generateDeviceId,

    getRefreshCookieOptions,

    getClearRefreshCookieOptions,

};