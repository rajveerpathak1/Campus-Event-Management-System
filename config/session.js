const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./db");

console.log("--Session Logic loaded--");

const sessionMiddleware = session({
  store: new pgSession({
    pool,
    tableName: "session",
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});

console.log("--Session Logic exported--");

module.exports = sessionMiddleware;
