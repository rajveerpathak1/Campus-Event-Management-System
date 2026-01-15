const express = require("express");
const pool = require("../config/db");
const isAuth = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT title FROM events");
    res.json(result.rows);
  } catch (error) {
    console.error("Event fetch error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
