require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { connectDB, getDB } = require("../config/db");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const MIGRATIONS_TABLE = "migrations";

const runMigrations = async () => {
  await connectDB();
  const db = getDB();

  await db.query(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log(`No migrations directory found at ${MIGRATIONS_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const alreadyApplied = await db.query(
      `SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE filename = $1`,
      [file]
    );

    if (alreadyApplied.rows.length > 0) {
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`Applying migration: ${file}`);

    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
        [file]
      );
      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }
};

runMigrations()
  .then(() => {
    console.log("Migrations complete");
    process.exit(0);
  })
  .catch(err => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  });

