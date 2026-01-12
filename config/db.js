const { Pool } = require("pg");

console.log("--db.js loaded--");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
});


(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("--PostgreSQL connection verified--");
  } catch (err) {
    console.error("--PostgreSQL connection failed: ${err}--");
    process.exit(1);
  }
})();

pool.on("connect", () => {
  console.log("--PostgreSQL client connected--");
});

pool.on("error", (err) => {
  console.error("--PostgreSQL error: ${err}-");
  process.exit(1);
});

module.exports = pool;
