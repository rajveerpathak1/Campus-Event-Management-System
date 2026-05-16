const { getDB } = require("../config/db");
const ApiError = require("../utils/ApiError");

const {
  sendRegistrationEmail,
  sendUnregisterEmail,
} = require("../services/emailService");

/* ================================================= */
/* REGISTER */
/* ================================================= */

const registerForEvent = async ({
  userId,
  eventId,
}) => {
  const pool = getDB();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ---------------- EVENT ---------------- */

    const eventRes = await client.query(
      `
      SELECT
        id,
        title,
        capacity,
        status,
        event_date

      FROM events

      WHERE id = $1
        AND is_deleted = false

      FOR UPDATE
      `,
      [eventId]
    );

    const event = eventRes.rows[0];

    if (!event) {
      throw new ApiError(
        404,
        "Event not found"
      );
    }

    if (event.status !== "published") {
      throw new ApiError(
        400,
        "Event not available"
      );
    }

    if (
      new Date(event.event_date) <
      new Date()
    ) {
      throw new ApiError(
        400,
        "Event already started/ended"
      );
    }

    /* ---------------- USER ---------------- */

    const userRes = await client.query(
      `
      SELECT
        id,
        name,
        email

      FROM users

      WHERE id = $1
      `,
      [userId]
    );

    const user = userRes.rows[0];

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    /* ---------------- CAPACITY ---------------- */

    const countRes = await client.query(
      `
      SELECT COUNT(*)::int AS count

      FROM registrations

      WHERE event_id = $1
      `,
      [eventId]
    );

    if (
      countRes.rows[0].count >=
      event.capacity
    ) {
      throw new ApiError(
        409,
        "Event is full"
      );
    }

    /* ---------------- INSERT ---------------- */

    let insertRes;

    try {
      insertRes = await client.query(
        `
        INSERT INTO registrations (
          user_id,
          event_id
        )

        VALUES ($1, $2)

        RETURNING id
        `,
        [userId, eventId]
      );
    } catch (err) {
      if (err.code === "23505") {
        throw new ApiError(
          409,
          "Already registered"
        );
      }

      throw err;
    }

    /* ---------------- COMMIT ---------------- */

    await client.query("COMMIT");

    /* ---------------- EMAIL ---------------- */

    try {
      await sendRegistrationEmail({
        to: user.email,
        name: user.name,
        eventTitle: event.title,
        eventDate: event.event_date,
      });
    } catch (emailErr) {
      console.error(
        "Registration email failed:",
        emailErr.message
      );
    }

    return {
      registrationId:
        insertRes.rows[0].id,
    };

  } catch (err) {
    await client.query("ROLLBACK");

    throw err;

  } finally {
    client.release();
  }
};

/* ================================================= */
/* UNREGISTER */
/* ================================================= */

const unregisterForEvent = async ({
  userId,
  eventId,
}) => {
  const db = getDB();

  /* ---------------- USER ---------------- */

  const userRes = await db.query(
    `
    SELECT
      id,
      name,
      email

    FROM users

    WHERE id = $1
    `,
    [userId]
  );

  const user = userRes.rows[0];

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  /* ---------------- EVENT ---------------- */

  const eventRes = await db.query(
    `
    SELECT
      id,
      title

    FROM events

    WHERE id = $1
    `,
    [eventId]
  );

  const event = eventRes.rows[0];

  if (!event) {
    throw new ApiError(
      404,
      "Event not found"
    );
  }

  /* ---------------- DELETE ---------------- */

  const result = await db.query(
    `
    DELETE FROM registrations

    WHERE user_id = $1
      AND event_id = $2

    RETURNING *
    `,
    [userId, eventId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(
      404,
      "Registration not found"
    );
  }

  /* ---------------- EMAIL ---------------- */

  try {
    await sendUnregisterEmail({
      to: user.email,
      name: user.name,
      eventTitle: event.title,
    });
  } catch (emailErr) {
    console.error(
      "Unregister email failed:",
      emailErr.message
    );
  }

  return result.rows[0];
};

/* ================================================= */
/* MY REGISTRATIONS */
/* ================================================= */

const getMyRegistrations = async (
  userId
) => {
  const db = getDB();

  const result = await db.query(
    `
    SELECT
      r.id AS registration_id,

      r.created_at AS registered_at,

      e.id AS event_id,

      e.title AS event_title,

      e.event_date,

      e.status AS event_status,

      e.capacity

    FROM registrations r

    JOIN events e
      ON e.id = r.event_id

    WHERE r.user_id = $1

    ORDER BY e.event_date DESC
    `,
    [userId]
  );

  return result.rows;
};

/* ================================================= */
/* ALL REGISTRATIONS */
/* ================================================= */

const getAllRegistrations =
  async () => {
    const pool = getDB();

    const result = await pool.query(
      `
      SELECT
        r.id AS registration_id,

        r.created_at AS registered_at,

        u.name AS user_name,

        u.email AS user_email,

        e.id AS event_id,

        e.title AS event_title,

        e.event_date

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

/* ================================================= */
/* EXPORTS */
/* ================================================= */

module.exports = {
  registerForEvent,
  unregisterForEvent,
  getMyRegistrations,
  getAllRegistrations,
};