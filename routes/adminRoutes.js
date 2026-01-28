const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { getDB } = require("../config/db");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("admin", "superAdmin"));

/* ==================== GET ALL EVENTS ==================== */
router.get(
  "/events",
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      start_date,
      end_date,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ["is_deleted = false"];
    const values = [];
    let idx = 1;

    if (status) {
      conditions.push(`status = $${idx++}`);
      values.push(status);
    }

    if (start_date) {
      conditions.push(`event_date >= $${idx++}`);
      values.push(start_date);
    }

    if (end_date) {
      conditions.push(`event_date <= $${idx++}`);
      values.push(end_date);
    }

    const db = getDB();
    const result = await db.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM events
       WHERE ${conditions.join(" AND ")}
       ORDER BY event_date DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limitNum, offset]
    );

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total: result.rows[0]?.total_count || 0,
      data: result.rows,
    });
  })
);

/* ==================== GET SINGLE EVENT ==================== */
router.get(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const db = getDB();

    const result = await db.query(
      `SELECT * FROM events
       WHERE id = $1 AND is_deleted = false`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  })
);

/* ==================== CREATE EVENT ==================== */
router.post(
  "/events",
  asyncHandler(async (req, res) => {
    const { title, description, event_date, capacity } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        success: false,
        message: "Title and event_date are required",
      });
    }

    const db = getDB();
    const result = await db.query(
      `INSERT INTO events
       (title, description, event_date, capacity, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [title, description, event_date, capacity]
    );

    res.status(201).json({
      success: true,
      message: "Event created",
      data: result.rows[0],
    });
  })
);

/* ==================== FULL UPDATE (PUT) ==================== */
router.put(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const { title, description, event_date, capacity } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        success: false,
        message: "Title and event_date are required",
      });
    }

    const db = getDB();
    const result = await db.query(
      `UPDATE events
       SET title = $1,
           description = $2,
           event_date = $3,
           capacity = $4,
           updated_at = NOW()
       WHERE id = $5 AND is_deleted = false
       RETURNING *`,
      [title, description, event_date, capacity, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({
      success: true,
      message: "Event updated",
      data: result.rows[0],
    });
  })
);

/* ==================== PARTIAL UPDATE (PATCH) ==================== */
router.patch(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const allowedFields = ["title", "description", "event_date", "capacity"];
    const updates = [];
    const values = [];
    let idx = 1;

    if (req.user.role !== "superAdmin" && "capacity" in req.body) {
      return res.status(403).json({
        success: false,
        message: "Only superAdmin can modify capacity",
      });
    }

    for (const key of Object.keys(req.body)) {
      if (!allowedFields.includes(key)) continue;
      updates.push(`${key} = $${idx}`);
      values.push(req.body[key]);
      idx++;
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided",
      });
    }

    values.push(req.params.id);

    const db = getDB();
    const result = await db.query(
      `UPDATE events
       SET ${updates.join(", ")},
           updated_at = NOW()
       WHERE id = $${idx} AND is_deleted = false
       RETURNING *`,
      values
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.json({
      success: true,
      message: "Event updated",
      data: result.rows[0],
    });
  })
);

/* ==================== SOFT DELETE ==================== */
router.delete(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const db = getDB();
    const result = await db.query(
      `UPDATE events
       SET is_deleted = true, updated_at = NOW()
       WHERE id = $1 AND is_deleted = false
       RETURNING id`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Event not found or already deleted",
      });
    }

    res.json({ success: true, message: "Event deleted" });
  })
);

/* ==================== STATUS ACTIONS ==================== */

router.post(
  "/events/:id/publish",
  asyncHandler(async (req, res) => {
    const db = getDB();
    const result = await db.query(
      `UPDATE events
       SET status = 'published', updated_at = NOW()
       WHERE id = $1 AND status = 'draft' AND is_deleted = false
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Event cannot be published in current state",
      });
    }

    res.json({ success: true, message: "Event published", data: result.rows[0] });
  })
);

router.post(
  "/events/:id/unpublish",
  asyncHandler(async (req, res) => {
    const db = getDB();
    const result = await db.query(
      `UPDATE events
       SET status = 'draft', updated_at = NOW()
       WHERE id = $1 AND status = 'published' AND is_deleted = false
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Event cannot be unpublished",
      });
    }

    res.json({
      success: true,
      message: "Event unpublished",
      data: result.rows[0],
    });
  })
);

router.post(
  "/events/:id/cancel",
  asyncHandler(async (req, res) => {
    const db = getDB();
    const result = await db.query(
      `UPDATE events
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
         AND status IN ('draft', 'published')
         AND is_deleted = false
       RETURNING *`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        success: false,
        message: "Event cannot be cancelled",
      });
    }

    res.json({
      success: true,
      message: "Event cancelled",
      data: result.rows[0],
    });
  })
);

module.exports = router;
