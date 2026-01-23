require("dotenv").config();

const createApp = require("./app");
const { connectDB } = require("./config/db");
const createSessionMiddleware = require("./config/session");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const sessionMiddleware = createSessionMiddleware();

    const app = createApp({ sessionMiddleware });

    app.listen(PORT, () => {
      console.log(`---Server running on port ${PORT}--`);
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
};

startServer();
