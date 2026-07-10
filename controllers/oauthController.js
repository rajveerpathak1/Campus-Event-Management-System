const asyncHandler = require("../utils/asyncHandler");

const authConfig = require("../config/auth");

const {
    hashToken,
} = require("../utils/token");

const {
    generateAccessToken,
    generateRefreshToken,
    generateDeviceId,
    getRefreshCookieOptions,
} = require("../services/tokenService");

const {

    findUserByOAuthAccount,

    findUserByEmail,

    createUser,

    linkOAuthAccount,

    storeRefreshToken,

    updateLastLogin,

} = require("../models/authModel");


const googleCallback = asyncHandler(

async (req, res) => {

    const profile = req.user;

    let user =
        await findUserByOAuthAccount({

            provider: "google",

            providerUserId:
                profile.googleId,

        });

    /*
    --------------------------------
    Existing OAuth Account
    --------------------------------
    */

    if (!user) {

        /*
        ----------------------------
        Existing Email?
        ----------------------------
        */

        user =
            await findUserByEmail(

                profile.email

            );

        if (user) {

            await linkOAuthAccount({

                userId:
                    user.id,

                provider:
                    "google",

                providerUserId:
                    profile.googleId,

            });

        }

        /*
        ----------------------------
        Completely New User
        ----------------------------
        */

        else {

            user =
                await createUser({

                    name:
                        profile.name,

                    email:
                        profile.email,

                    passwordHash:
                        null,

                    role:
                        "student",

                    emailVerified:
                        true,

                });

            await linkOAuthAccount({

                userId:
                    user.id,

                provider:
                    "google",

                providerUserId:
                    profile.googleId,

            });

        }

    }

    /*
    --------------------------------
    JWT
    --------------------------------
    */

    const accessToken =
        generateAccessToken(user);

    const refreshToken =
generateRefreshToken({
    userId: user.id,
});

    await storeRefreshToken({

        userId:
            user.id,

        tokenHash:
            hashToken(refreshToken),

        deviceId:
            generateDeviceId(),

        deviceName:
req.headers["sec-ch-ua-platform"] ||
req.headers["user-agent"] ||
"Unknown Device",

        userAgent:
            req.headers[
                "user-agent"
            ],

        ipAddress:
            req.ip,

        expiresAt:
            new Date(

                Date.now()

                +

                authConfig.refreshCookieMaxAge

            ),

    });

    await updateLastLogin(
        user.id
    );

    res.cookie(

        authConfig.refreshCookieName,

        refreshToken,

        getRefreshCookieOptions()

    );

    res.redirect(

`${authConfig.frontendUrl}/oauth-success?token=${accessToken}`

    );

});


module.exports = {
    googleCallback,
};