const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let { search = "", limit = 10 } = req.query;

    limit = Number(limit);
    if (isNaN(limit) || limit <= 0) limit = 10;
    if (limit > 50) limit = 50;

    const searchPattern = `${search}%`;

    const result = await pool.query(
      "SELECT title FROM events WHERE title ILIKE $1 LIMIT $2",
      [searchPattern, limit]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Event fetch error:", error);
    return res.status(500).json({ message: "Database error" });
  }
});


router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM events WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No event found with the given ID"
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Event fetch error:", error);
    return res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
