require("dotenv").config();
const argon2 = require("argon2");
const { connectDB, getDB } = require("../config/db");

const seedSuperAdmin = async () => {
  await connectDB();
  const pool = getDB();

  try {
    // Check if any super-admin already exists
    const checkRes = await pool.query(
      "SELECT id, email, name FROM users WHERE role = 'super-admin' LIMIT 1"
    );

    if (checkRes.rows.length > 0) {
      console.log(
        `[Seed] A Super Admin already exists in the database: ${checkRes.rows[0].email} (ID: ${checkRes.rows[0].id})`
      );
      process.exit(0);
    }

    const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@campus.edu";
    const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
    const name = process.env.SUPER_ADMIN_NAME || "System Super Admin";

    // Hash password using argon2
    const passwordHash = await argon2.hash(password);

    const insertRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, email_verified_at, is_active)
       VALUES ($1, $2, $3, 'super-admin', NOW(), TRUE)
       RETURNING id, name, email, role`,
      [name, email, passwordHash]
    );

    const superAdmin = insertRes.rows[0];
    console.log("==========================================");
    console.log("SUCCESS: Super Admin Seeded Successfully!");
    console.log(`ID    : ${superAdmin.id}`);
    console.log(`Name  : ${superAdmin.name}`);
    console.log(`Email : ${superAdmin.email}`);
    console.log(`Role  : ${superAdmin.role}`);
    console.log("==========================================");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding Super Admin:", err.message);
    process.exit(1);
  }
};

seedSuperAdmin();
