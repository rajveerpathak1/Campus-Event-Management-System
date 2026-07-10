const express = require("express");
const passport = require("passport");

const {

    googleCallback,

} = require("../controllers/oauthController");




/**
 * @swagger
 * tags:
 *   name: OAuth
 *   description: OAuth 2.0 Integration APIs
 */

const router = express.Router();

/**
 * @swagger
 * /oauth/google:
 *   get:
 *     summary: Initiate Google OAuth 2.0 authentication flow
 *     tags: [OAuth]
 *     description: Redirects the client to Google's sign-in page to authenticate.
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent page.
 */
router.get(

    "/google",

    passport.authenticate("google", {

    scope: ["profile", "email"],

    state: true,

})

);

/**
 * @swagger
 * /oauth/google/callback:
 *   get:
 *     summary: Google OAuth 2.0 callback endpoint
 *     tags: [OAuth]
 *     description: Google redirects back to this endpoint with authentication code. Backend exchanges code, registers/logs in the user, and redirects to frontend with refresh token cookie set and access token in parameters.
 *     responses:
 *       302:
 *         description: Redirect to frontend URL with accessToken query parameter, setting httpOnly refreshToken cookie.
 */
router.get(

    "/google/callback",

    passport.authenticate(

        "google",

        {

            session: false,

        }

    ),

    googleCallback

);

module.exports = router;