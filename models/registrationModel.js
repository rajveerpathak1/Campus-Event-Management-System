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
    if (!event) throw new ApiError(404, "Event not found");

    if (event.status !== "published") {
      throw new ApiError(400, "Event not available");
    }

    // 🔥 NEW: prevent past registrations
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

    return { registrationId: insertRes.rows[0].id };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};


module.exports = {
  registerForEvent,
};
