const { Pool } = require("pg");

let pool;

const connectDB = async () => {
  try {
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
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
        };

    pool = new Pool({
      ...config,

      // Pool configuration
      max: 50,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
    });

    // Test initial connection
    await pool.query("SELECT 1");

    console.log("✅ PostgreSQL connected");

    // Fires whenever a new client is created
    pool.on("connect", () => {
      console.log("🟢 PostgreSQL client connected");
    });

    // Fires when an idle client encounters an error
    pool.on("error", (err) => {
      console.error("🔴 Unexpected PostgreSQL pool error:", err);

      // Don't terminate the server.
      // The pool will usually recover automatically.
    });

    // Fires when a client is removed from the pool
    pool.on("remove", () => {
      console.log("🟡 PostgreSQL client removed from pool");
    });

    return pool;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }

  return pool;
};

const disconnectDB = async () => {
  if (pool) {
    await pool.end();
    console.log("🔌 PostgreSQL pool closed");
  }
};

module.exports = {
  connectDB,
  getDB,
  disconnectDB,
};