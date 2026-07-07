const {
    extractBearerToken,
    verifyAccessToken,
} = require("../services/tokenService");

const {
    findUserById,
} = require("../models/authModel");

module.exports = async (req, res, next) => {

    try {

        const token =
            extractBearerToken(req);

        if (!token) {

            req.user = null;

            return next();

        }

        const payload =
            verifyAccessToken(token);

        const user =
            await findUserById(payload.sub);

        if (!user) {

            req.user = null;

            return next();

        }

        req.user = {

            id: user.id,

            role: user.role,

            email: user.email,

            name: user.name,

        };

    } catch {

        req.user = null;

    }

    next();

};