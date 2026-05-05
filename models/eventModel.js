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
    [`%${search}%`, limit, offset, userId || null] // 🔥 FIXED SEARCH
  );

  return {
    rows: result.rows,
    total: result.rows[0]?.total_count || 0,
  };
};

const getEventByIdStudent = async (id) => {
  const db = getDB();

  const result = await db.query(
    `
    SELECT *
    FROM events
    WHERE id = $1
      AND is_deleted = false
      AND status = 'published'
    `,
    [id]
  );

  return result.rows[0];
};

const createEventAdmin = async ({ title, description, event_date, capacity }) => {
  const db = getDB();
  return db.query(
    `INSERT INTO events
     (title, description, event_date, capacity, status)
     VALUES ($1, $2, $3, $4, 'draft')
     RETURNING *`,
    [title, description, event_date, capacity]
  );
};

module.exports = {
  searchEvents,
  getEventByIdStudent,
  createEventAdmin,
};