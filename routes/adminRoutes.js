const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { getDB } = require("../config/db");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("admin", "superAdmin"));

/* -------------------- CREATE EVENT -------------------- */
router.post(
  "/events",
  asyncHandler(async (req, res) => {
    const { title, description, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: "Title and date are required",
      });
    }

    const db = getDB();
    const result = await db.query(
      `INSERT INTO events (title, description, date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, description, date]
    );

    res.status(201).json({
      success: true,
      message: "Event created",
      data: result.rows[0],
    });
  })
);

module.exports = router;
