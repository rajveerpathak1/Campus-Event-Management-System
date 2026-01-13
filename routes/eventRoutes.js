const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const isauth = require("../middlewares/authMiddleware.js")


router.get("/",isauth ,async (req, res) => {
  try {
    const result = await pool.query("SELECT title FROM events");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
