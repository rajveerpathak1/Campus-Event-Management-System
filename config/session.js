const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./db");


console.log("--Session Loigc loaded--");


const sessionMiddleware = session({
  store: new pgSession({
    pool: pool,
    tableName: "session"
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

console.log("--Session Logic exported--");

module.exports = sessionMiddleware;
