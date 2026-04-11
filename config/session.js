const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { getDB } = require("./db");

const createSessionMiddleware = () => {
  const pool = getDB(); // ✅ ensure this is singleton

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not defined");
  }

  const isProd = process.env.NODE_ENV === "production";

  return session({
    name: `${process.env.NODE_ENV || "dev"}.campus.sid`,

    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15, // ✅ clean expired sessions every 15 min
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,
    rolling: true,

    proxy: isProd,

    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  });
};

module.exports = createSessionMiddleware;