const { getDB } = require("../config/db");
const ApiError = require("../utils/ApiError");

const registrationError = (status, message, details) => {
  return new ApiError(status, message, details);
};

/* ==================== REGISTER (TX SAFE) ==================== */
const registerForEvent = async ({ userId, eventId }) => {
  const pool = getDB();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventRes = await client.query(
      `SELECT id, capacity, status
       FROM events
       WHERE id = $1 AND is_deleted = false
       FOR UPDATE`,
      [eventId]
    );

    const event = eventRes.rows[0];
    if (!event) {
      throw registrationError(404, "Event not found");
    }

    if (event.status !== "published") {
      throw registrationError(400, "Event not available");
    }

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM registrations
       WHERE event_id = $1`,
      [eventId]
    );

    if (countRes.rows[0].count >= event.capacity) {
      throw registrationError(409, "Event is full");
    }

    let insertRes;
    try {
      insertRes = await client.query(
        `INSERT INTO registrations (user_id, event_id)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, eventId]
      );
    } catch (err) {
      if (err.code === "23505") {
        throw registrationError(409, "Already registered");
      }
      throw err;
    }

    await client.query("COMMIT");

    return { registrationId: insertRes.rows[0].id };

  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
};

/* ==================== QUERIES ==================== */
const getMyRegistrations = async (userId) => {
  const db = getDB();
  const result = await db.query(
    `SELECT
      r.id AS registration_id,
      r.created_at AS registered_at,
      e.id AS event_id,
      e.title,
      e.event_date,
      e.capacity,
      e.status
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.user_id = $1
     ORDER BY e.event_date DESC`,
    [userId]
  );

  return result.rows;
};

const getAllRegistrations = async ({ eventId, limit = 50, offset = 0 }) => {
  const db = getDB();

  const l = Math.max(1, Math.min(200, Number(limit)));
  const o = Math.max(0, Number(offset));

  const where = ["1=1"];
  const values = [];
  let idx = 1;

  if (eventId) {
    where.push(`e.id = $${idx++}`);
    values.push(Number(eventId));
  }

  const result = await db.query(
    `SELECT
      r.id AS registration_id,
      r.created_at AS registered_at,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      e.id AS event_id,
      e.title AS event_title,
      e.event_date,
      e.status AS event_status
     FROM registrations r
     JOIN users u ON u.id = r.user_id
     JOIN events e ON e.id = r.event_id
     WHERE ${where.join(" AND ")}
     ORDER BY e.event_date DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...values, l, o]
  );

  return result.rows;
};

/* ==================== UNREGISTER ==================== */
const unregisterForEvent = async ({ userId, eventId }) => {
  const db = getDB();

  const result = await db.query(
    `DELETE FROM registrations
     WHERE user_id = $1
       AND event_id = $2
     RETURNING id`,
    [userId, eventId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Registration not found");
  }

  return { registrationId: result.rows[0].id };
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getAllRegistrations,
  unregisterForEvent,
};

