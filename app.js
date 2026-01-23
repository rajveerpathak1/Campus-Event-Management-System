const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");

const errorHandler = require("./middlewares/errorMiddleware");

const createApp = ({ sessionMiddleware }) => {
  const app = express();


  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }


  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
    : [];

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error("CORS not allowed"));
      },
      credentials: true,
    })
  );


  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Campus Event Management API running",
    });
  });


  app.use("/auth", authRoutes);
  app.use("/events", eventRoutes);
  app.use("/students", studentRoutes);
  app.use("/admin", adminRoutes);
  app.use("/super-admin", superAdminRoutes);


  app.use(errorHandler);

  return app;
};

module.exports = createApp;
