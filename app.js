const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");

const errorHandler = require("./middlewares/errorMiddleware");

const createApp = ({ sessionMiddleware }) => {
  const app = express();

  // Trust proxy (important for cookies in production)
  app.set("trust proxy", 1);

  //  Security & parsing
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  //  Logging
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  //  CORS setup (cleaned)
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
    : [];

  app.use(
    cors({
      origin: (origin, cb) => {
        // allow no-origin (Postman, mobile apps)
        if (!origin) return cb(null, true);

        // allow all if no env set
        if (allowedOrigins.length === 0) return cb(null, true);

        if (allowedOrigins.includes(origin)) {
          return cb(null, true);
        }

        return cb(new Error("CORS not allowed"));
      },
      credentials: true,
    })
  );

  app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

  //  Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    })
  );

  //  Session middleware
  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  //  Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  //  Root route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Campus Event Management API running",
    });
  });

  //  Routes
  app.use("/auth", authRoutes);
  app.use("/events", eventRoutes);
  app.use("/students", studentRoutes);
  app.use("/admin", adminRoutes);
  app.use("/super-admin", superAdminRoutes);

  //  404 handler (BEFORE error handler)
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  //  Global error handler (LAST)
  app.use(errorHandler);

  return app;
};

module.exports = createApp;