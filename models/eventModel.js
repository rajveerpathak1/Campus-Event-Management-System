const { getDB } = require("../config/db");

/* ==================== SEARCH EVENTS (STUDENT) ==================== */
const searchEvents = async ({ search = "", limit, offset, userId }) => {
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
        WHERE r2.event_id = e.id
          AND r2.user_id = $4
      ) AS "isRegistered",

      COUNT(*) OVER() AS total_count

    FROM events e
    LEFT JOIN registrations r
      ON r.event_id = e.id

    WHERE e.is_deleted = false
      AND e.status = 'published'
      AND e.title ILIKE $1

    GROUP BY e.id

    ORDER BY e.event_date DESC

    LIMIT $2 OFFSET $3
    `,
    [`%${search}%`, limit, offset, userId || null]
  );

  return {
    rows: result.rows,
    total: result.rows[0]?.total_count || 0,
  };
};

/* ==================== STUDENT GET EVENT ==================== */
const getEventByIdStudent = async (id, userId = null) => {
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
      e.created_at,
      e.updated_at,
      COUNT(r.id)::int AS "registeredCount",
      EXISTS (
        SELECT 1
        FROM registrations r2
        WHERE r2.event_id = e.id
          AND r2.user_id = $2
      ) AS "isRegistered"
    FROM events e
    LEFT JOIN registrations r
      ON r.event_id = e.id
    WHERE e.id = $1
      AND e.is_deleted = false
      AND e.status = 'published'
    GROUP BY e.id
    `,
    [id, userId]
  );

  return result.rows[0];
};

/* ==================== ADMIN GET ALL EVENTS ==================== */
const getAllEventsAdmin = async ({
  status,
  start_date,
  end_date,
  limit,
  offset,
}) => {
  const db = getDB();

  const conditions = ["e.is_deleted = false"];
  const values = [];
  let idx = 1;

  if (status) {
    conditions.push(`e.status = $${idx++}`);
    values.push(status);
  }

  if (start_date) {
    conditions.push(`e.event_date >= $${idx++}`);
    values.push(start_date);
  }

  if (end_date) {
    conditions.push(`e.event_date <= $${idx++}`);
    values.push(end_date);
  }

  values.push(limit);
  values.push(offset);

  const result = await db.query(
    `
    SELECT
      e.*,
      COUNT(r.id)::int AS registered_count,
      COUNT(*) OVER() AS total_count

    FROM events e
    LEFT JOIN registrations r
      ON r.event_id = e.id

    WHERE ${conditions.join(" AND ")}

    GROUP BY e.id

    ORDER BY e.event_date DESC

    LIMIT $${idx++}
    OFFSET $${idx++}
    `,
    values
  );

  return result;
};

/* ==================== ADMIN GET EVENT BY ID ==================== */
const getEventByIdAdmin = async (id) => {
  const db = getDB();

  const result = await db.query(
    `
    SELECT
      e.*,
      COUNT(r.id)::int AS registered_count

    FROM events e
    LEFT JOIN registrations r
      ON r.event_id = e.id

    WHERE e.id = $1
      AND e.is_deleted = false

    GROUP BY e.id
    `,
    [id]
  );

  return result.rows[0];
};

/* ==================== CREATE EVENT ==================== */
const createEventAdmin = async ({
  title,
  description,
  event_date,
  capacity,
}) => {
  const db = getDB();

  return db.query(
    `
    INSERT INTO events
    (title, description, event_date, capacity, status)

    VALUES ($1, $2, $3, $4, 'draft')

    RETURNING *
    `,
    [title, description, event_date, capacity]
  );
};

/* ==================== UPDATE EVENT ==================== */
const updateEventAdmin = async (id, updates, values) => {
  const db = getDB();

  values.push(id);

  return db.query(
    `
    UPDATE events
    SET
      ${updates.join(", ")},
      updated_at = NOW()

    WHERE id = $${values.length}
      AND is_deleted = false

    RETURNING *
    `,
    values
  );
};

/* ==================== SOFT DELETE ==================== */
const softDeleteEventAdmin = async (id) => {
  const db = getDB();

  return db.query(
    `
    UPDATE events
    SET
      is_deleted = true,
      updated_at = NOW()

    WHERE id = $1
      AND is_deleted = false

    RETURNING *
    `,
    [id]
  );
};

/* ==================== UPDATE STATUS ==================== */
const updateEventStatusAdmin = async (
  id,
  newStatus,
  allowedCurrentStatuses
) => {
  const db = getDB();

  return db.query(
    `
    UPDATE events
    SET
      status = $1,
      updated_at = NOW()

    WHERE id = $2
      AND status = ANY($3)
      AND is_deleted = false

    RETURNING *
    `,
    [newStatus, id, allowedCurrentStatuses]
  );
};

module.exports = {
  searchEvents,
  getEventByIdStudent,

  getAllEventsAdmin,
  getEventByIdAdmin,

  createEventAdmin,
  updateEventAdmin,

  softDeleteEventAdmin,
  updateEventStatusAdmin,
};
