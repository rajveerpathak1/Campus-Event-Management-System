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

const getEventById = async (id) => {
  const db = getDB();

  const result = await db.query(
    "SELECT * FROM events WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

/* ===== NEW ADMIN-ONLY METHODS ===== */

const getAllEventsAdmin = async ({
  status,
  start_date,
  end_date,
  limit,
  offset,
}) => {
  const conditions = ["is_deleted = false"];
  const values = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    values.push(status);
  }

  if (start_date) {
    conditions.push(`event_date >= $${idx++}`);
    values.push(start_date);
  }

  if (end_date) {
    conditions.push(`event_date <= $${idx++}`);
    values.push(end_date);
  }

  const db = getDB();
  return db.query(
    `SELECT *, COUNT(*) OVER() AS total_count
     FROM events
     WHERE ${conditions.join(" AND ")}
     ORDER BY event_date DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...values, limit, offset]
  );
};

const createEventAdmin = async ({
  title,
  description,
  event_date,
  capacity,
}) => {
  const db = getDB();
  return db.query(
    `INSERT INTO events
     (title, description, event_date, capacity, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING *`,
    [title, description, event_date, capacity]
  );
};

const updateEventAdmin = async (id, fields, values) => {
  const db = getDB();
  return db.query(
    `UPDATE events
     SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length + 1} AND is_deleted = false
     RETURNING *`,
    [...values, id]
  );
};

const softDeleteEventAdmin = async (id) => {
  const db = getDB();
  return db.query(
    `UPDATE events
     SET is_deleted = true, updated_at = NOW()
     WHERE id = $1 AND is_deleted = false
     RETURNING id`,
    [id]
  );
};

const updateEventStatusAdmin = async (id, status, allowedStatuses) => {
  const db = getDB();
  return db.query(
    `UPDATE events
     SET status = $1, updated_at = NOW()
     WHERE id = $2
       AND status = ANY($3)
       AND is_deleted = false
     RETURNING *`,
    [status, id, allowedStatuses]
  );
};

module.exports = {
  searchEvents,
  getEventById,

  // admin exports
  getAllEventsAdmin,
  createEventAdmin,
  updateEventAdmin,
  softDeleteEventAdmin,
  updateEventStatusAdmin,
};
