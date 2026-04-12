const { getDB } = require("../config/db");


const searchEvents = async ({ search, limit, offset, userId }) => {
  const db = getDB();

  const result = await db.query(
    `
    SELECT
      e.id,
      e.title,
      e.description,
      e.event_date,
      e.capacity,
      e.status,

      COUNT(r.id)::int AS "registeredCount",

      EXISTS (
        SELECT 1
        FROM registrations r2
        WHERE r2.event_id = e.id AND r2.user_id = $4
      ) AS "isRegistered",

      COUNT(*) OVER() AS total_count

    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id

    WHERE e.is_deleted = false
      AND e.status = 'published'
      AND e.title ILIKE $1

    GROUP BY e.id
    ORDER BY e.event_date DESC

    LIMIT $2 OFFSET $3
    `,
    [`${search}%`, limit, offset, userId || null]
  );

  const rows = result.rows;
  const total = rows[0]?.total_count || 0;

  return { rows, total };
};

// Admin view: includes drafts/published/cancelled (but still allows admin to enforce is_deleted checks).
const getEventByIdAdmin = async (id) => {
  const db = getDB();

  const result = await db.query(
    "SELECT * FROM events WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

// Student view: only published and not deleted.
const getEventByIdStudent = async (id) => {
  const db = getDB();

  const result = await db.query(
    `SELECT *
     FROM events
     WHERE id = $1
       AND is_deleted = false
       AND status = 'published'`,
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


// 🔥 Get events registered by a student
const getMyRegistrations = async (userId) => {
  const db = getDB();

  const result = await db.query(
    `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.event_date,
      e.capacity,
      e.status,
      COUNT(r2.id) AS registered_count
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    LEFT JOIN registrations r2 ON r2.event_id = e.id
    WHERE r.user_id = $1
      AND e.is_deleted = false
    GROUP BY e.id
    ORDER BY e.event_date DESC
    `,
    [userId]
  );

  return result.rows;
};

module.exports = {
  searchEvents,
  getEventByIdStudent,
  getEventByIdAdmin,

  // admin exports
  getAllEventsAdmin,
  createEventAdmin,
  updateEventAdmin,
  softDeleteEventAdmin,
  updateEventStatusAdmin,
  getMyRegistrations,
};
