const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { getDB } = require("./db");

const createSessionMiddleware = () => {
  return session({
    name: "campus.sid",
    store: new PgSession({
      pool: getDB(),
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
};

module.exports = createSessionMiddleware;
