const express = require("express");
const cors = require("cors");
const session = require("./config/session");


const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const studentRoute = require("./routes/studentRoutes");
const adminRoute = require("./routes/adminRoutes");
const superAdminRoute = require("./routes/superAdminRoutes");

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(origin => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server, Postman, curl
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      console.error("Blocked by CORS:", origin);
      const err = new Error("CORS not allowed");
      err.status = 403;
      cb(err);
    },
    credentials: true,
  })
);

app.use(session);


app.get("/", (req, res) => {
  if (process.env.NODE_ENV === "development") {
    console.log("Server pinged");
  }

  res.status(200).json({
    success: true,
    message: "Campus Event Management API running",
  });
});

console.log("session:", typeof session);
console.log("authRoutes:", typeof authRoutes);
console.log("eventRoutes:", typeof eventRoutes);
console.log("studentRoute:", typeof studentRoute);
console.log("adminRoute:", typeof adminRoute);
console.log("superAdminRoute:", typeof superAdminRoute);


app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
