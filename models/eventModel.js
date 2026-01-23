const { getDB } = require("../config/db");

const searchEvents = async ({ search, limit }) => {
  const db = getDB();

  const result = await db.query(
    `SELECT id, title
     FROM events
     WHERE title ILIKE $1
     ORDER BY id DESC
     LIMIT $2`,
    [`${search}%`, limit]
  );

  return result.rows;
};

const getEventById = async id => {
  const db = getDB();

  const result = await db.query(
    "SELECT * FROM events WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

module.exports = {
  searchEvents,
  getEventById,
};
