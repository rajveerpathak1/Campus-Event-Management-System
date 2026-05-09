const { getDB } = require("../config/db");
const ApiError = require("../utils/ApiError");

const registerForEvent = async ({ userId, eventId }) => {
  const pool = getDB();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventRes = await client.query(
      `SELECT id, capacity, status, event_date
       FROM events
       WHERE id = $1 AND is_deleted = false
       FOR UPDATE`,
      [eventId]
    );

    const event = eventRes.rows[0];

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    if (event.status !== "published") {
      throw new ApiError(400, "Event not available");
    }

    // Prevent registration for past events
    if (new Date(event.event_date) < new Date()) {
      throw new ApiError(400, "Event already started/ended");
    }

    const countRes = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM registrations
       WHERE event_id = $1`,
      [eventId]
    );

    if (countRes.rows[0].count >= event.capacity) {
      throw new ApiError(409, "Event is full");
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
        throw new ApiError(409, "Already registered");
      }

      throw err;
    }

    await client.query("COMMIT");

    return {
      registrationId: insertRes.rows[0].id,
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
};


// ✅ NEW FUNCTION
const getAllRegistrations = async () => {
  const pool = getDB();

  const result = await pool.query(
    `
    SELECT
      r.id,
      r.created_at AS "registeredAt",

      u.name AS "userName",
      u.email AS "userEmail",

      e.title AS "eventTitle",
      e.event_date AS "eventDate"

    FROM registrations r

    JOIN users u
      ON r.user_id = u.id

    JOIN events e
      ON r.event_id = e.id

    ORDER BY r.created_at DESC
    `
  );

  return result.rows;
};


module.exports = {
  registerForEvent,
  getAllRegistrations,
};
