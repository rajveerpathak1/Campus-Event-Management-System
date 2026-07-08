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

            return done(null, {

                googleId:
                    profile.id,

                email:
                    profile.emails[0].value,

                name:
                    profile.displayName,

            });

        }

    )

);

module.exports = passport;