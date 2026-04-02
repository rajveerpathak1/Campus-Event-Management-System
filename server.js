require("dotenv").config();

const createApp = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const createSessionMiddleware = require("./config/session");

const PORT = process.env.PORT || 5000;

let server; 

const startServer = async () => {
  try {
    await connectDB();

    const sessionMiddleware = createSessionMiddleware();
    const app = createApp({ sessionMiddleware });

    server = app.listen(PORT, () => {
      console.log(`---Server running on port ${PORT}--`);
    });

  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed");

      try {
        await disconnectDB();
        console.log("Database disconnected");
      } catch (err) {
        console.error("Error during DB disconnect:", err);
      }

      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown");
      process.exit(1);
    }, 10000).unref?.();
  } else {
    process.exit(0);
  }
};


process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);


process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  shutdown("unhandledRejection");
});


startServer();