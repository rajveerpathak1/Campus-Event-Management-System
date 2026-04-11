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
    console.log("✅ PostgreSQL connected successfully");

    return pool;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return pool;
};

const disconnectDB = async () => {
  if (pool) {
    await pool.end();
    console.log("Database pool closed");
  }
};

module.exports = {
  connectDB,
  getDB,
  disconnectDB,
};

// module.exports = {
//   connectDB,
//   getDB,
// };
