const { Pool } = require("pg");

let pool;

const connectDB = async () => {
  try {
    pool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
          }
        : {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl:
              process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: false }
                : false,
          }
    );

    await pool.query("SELECT 1");

    console.log(" PostgreSQL connected");

    // Handle unexpected errors
    pool.on("error", (err) => {
      console.error("Unexpected DB error:", err);
      process.exit(1);
    });

    return pool;
  } catch (error) {
    console.error(" DB connection failed:", error.message);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error("Database not initialized");
  }
  return pool;
};

const disconnectDB = async () => {
  if (pool) {
    await pool.end();
    console.log(" DB pool closed");
  }
};

module.exports = {
  connectDB,
  getDB,
  disconnectDB,
};