require("dotenv").config();
const argon2 = require("argon2");
const { connectDB, getDB } = require("../config/db");

const seedTestUsers = async () => {
  await connectDB();
  const pool = getDB();

  try {
    const passwordHash = await argon2.hash("Password123!");

    // Delete existing test users if they exist
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [
      "teststudent@campus.edu",
      "testadmin@campus.edu"
    ]);

    // Insert student
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, email_verified_at, is_active)
       VALUES ($1, $2, $3, 'student', NOW(), TRUE)`,
      ["Test Student", "teststudent@campus.edu", passwordHash]
    );
    console.log("Seeded Student: teststudent@campus.edu");

    // Insert admin
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, email_verified_at, is_active)
       VALUES ($1, $2, $3, 'admin', NOW(), TRUE)`,
      ["Test Admin", "testadmin@campus.edu", passwordHash]
    );
    console.log("Seeded Admin: testadmin@campus.edu");

    process.exit(0);
  } catch (err) {
    console.error("Error seeding test users:", err.message);
    process.exit(1);
  }
};

seedTestUsers();
