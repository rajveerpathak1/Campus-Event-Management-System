require("dotenv").config();
const logger = require("./utils/logger");
const createApp = require("./app");
const { connectDB, disconnectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await connectDB();

    const app = createApp();

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(` Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed");

      try {
        await disconnectDB();
        logger.info("Database disconnected");
      } catch (err) {
        logger.error("DB disconnect error:", err);
      }

      process.exit(0);
    });


    setTimeout(() => {
      logger.error(" Forced shutdown");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};


process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("uncaughtException", (err) => {
  logger.error(" Uncaught Exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (err) => {
  logger.error(" Unhandled Rejection:", err);
  shutdown("unhandledRejection");
});

startServer();