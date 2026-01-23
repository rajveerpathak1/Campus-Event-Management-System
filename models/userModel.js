const { getDB } = require("../config/db");

const findUserByEmail = async email => {
  const db = getDB();
  const result = await db.query(
    "SELECT id, name, email, password, role FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

const createUser = async ({ name, email, password, role }) => {
  const db = getDB();
  const result = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, password, role]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const db = getDB();
  const result = await db.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

const getAllUsers = async () => {
  const db = getDB();
  const result = await db.query(
    "SELECT id, name, email, role FROM users ORDER BY id DESC"
  );
  return result.rows;
};

const updateUserRole = async (id, role) => {
  const db = getDB();
  const result = await db.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role",
    [role, id]
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  getAllUsers,
  updateUserRole,
};

