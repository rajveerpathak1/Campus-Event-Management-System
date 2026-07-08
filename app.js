const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const logger = require("./utils/logger");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");


const authRoutes = require("./routes/authRoutes");
const oauthRoutes = require("./routes/oauthRoutes");
const eventRoutes = require("./routes/eventRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const cookieParser = require("cookie-parser");


const errorHandler = require("./middlewares/errorMiddleware");

const passport = require("./config/passport");

app.use(passport.initialize());


const createApp = ({ sessionMiddleware }) => {
  const app = express();

  app.set("trust proxy", 1);

  //  Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  //  Prevent parameter pollution
  app.use(hpp());
  app.use(cookieParser());

  //  Body parsing
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true }));

  //  Compression
  app.use(compression());

  //  Logging
  if (process.env.NODE_ENV === "development") {
    app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
  }

  //  CORS
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : [];

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.length === 0) return cb(null, true);

        if (allowedOrigins.includes(origin)) return cb(null, true);

        return cb(new Error("CORS not allowed"));
      },
      credentials: true,
    })
  );

  //  Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many requests, try again later",
    })
  );

  //  Session
  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  // swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


  //  Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  //  Root
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Campus Event Management API running",
    });
  });

  //  API Versioning
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/oauth",oauthRoutes);
  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/students", studentRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/super-admin", superAdminRoutes);

  //  404
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  //  Global error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;