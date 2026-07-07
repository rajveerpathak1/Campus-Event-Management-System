const ApiError = require("../utils/ApiError");

const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {

            return next(

                new ApiError(
                    401,
                    "Unauthorized"
                )

            );

        }

        if (

            !roles.includes(req.user.role)

        ) {

            return next(

                new ApiError(
                    403,
                    "Forbidden"
                )

            );

        }

        next();

    };

};

module.exports = {

    authorizeRoles,

};