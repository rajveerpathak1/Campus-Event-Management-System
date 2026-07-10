const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const {
    extractBearerToken,
    verifyAccessToken,
} = require("../services/tokenService");

const {
    findUserById,
} = require("../models/authModel");

module.exports = asyncHandler(

    async (req, res, next) => {

        const token =
            extractBearerToken(req);

        if (!token) {

            throw new ApiError(
                401,
                "Access token missing"
            );

        }

        let payload;

        try {

            payload =
                verifyAccessToken(token);

        } catch {

            throw new ApiError(
                401,
                "Invalid or expired access token"
            );

        }

        const user =
            await findUserById(payload.sub);

        if (!user) {

            throw new ApiError(
                401,
                "User not found"
            );

        }

        if (user.is_active === false) {

            throw new ApiError(
                403,
                "Account is disabled"
            );

        }

        req.user = {

            id: user.id,

            email: user.email,

            role: user.role,

            name: user.name,

        };

        next();

    }

);