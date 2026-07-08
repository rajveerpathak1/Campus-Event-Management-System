const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const authConfig = require("./auth");

passport.use(

    new GoogleStrategy(

        {

            clientID:
                authConfig.googleClientId,

            clientSecret:
                authConfig.googleClientSecret,

            callbackURL:
                authConfig.googleCallbackUrl,

        },

        async (

            accessToken,

            refreshToken,

            profile,

            done

        ) => {

           const email = profile.emails?.[0]?.value;

if (!email) {
    return done(new Error("Google account has no email."));
}

return done(null, {
    googleId: profile.id,
    email,
    name: profile.displayName,
});

        }

    )

);

module.exports = passport;