const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { getDB } = require("./db");

const createSessionMiddleware = () => {
  const pool = getDB();

  const isProduction = process.env.NODE_ENV === "production";

  return session({
    name: "campus.sid",

    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    proxy: true,

    cookie: {
      httpOnly: true,
      secure: isProduction, //  FIXED
      sameSite: isProduction ? "none" : "lax", //  FIXED
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
};

module.exports = createSessionMiddleware;