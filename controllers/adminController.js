const EventModel = require("../models/eventModel");

/* ==================== GET ALL EVENTS ==================== */
exports.getAllEvents = async (req, res) => {
  const { page = 1, limit = 10, status, start_date, end_date } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const offset = (pageNum - 1) * limitNum;

  const result = await EventModel.getAllEventsAdmin({
    status,
    start_date,
    end_date,
    limit: limitNum,
    offset,
  });

  res.json({
    success: true,
    page: pageNum,
    limit: limitNum,
    total: result.rows[0]?.total_count || 0,
    data: result.rows,
  });
};

/* ==================== GET SINGLE EVENT ==================== */
exports.getEventById = async (req, res) => {
  const event = await EventModel.getEventById(req.params.id);

  if (!event || event.is_deleted) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  res.json({ success: true, data: event });
};

/* ==================== CREATE EVENT ==================== */
exports.createEvent = async (req, res) => {
  const { title, event_date } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({
      success: false,
      message: "Title and event_date are required",
    });
  }

  const result = await EventModel.createEventAdmin(req.body);

  res.status(201).json({
    success: true,
    message: "Event created",
    data: result.rows[0],
  });
};

/* ==================== FULL / PARTIAL UPDATE ==================== */
exports.updateEvent = async (req, res) => {
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

  for (const key of allowedFields) {
    if (key in req.body) {
      updates.push(`${key} = $${idx++}`);
      values.push(req.body[key]);
    }
  }

  if (!updates.length) {
    return res.status(400).json({
      success: false,
      message: "No valid fields provided",
    });
  }

  const result = await EventModel.updateEventAdmin(
    req.params.id,
    updates,
    values
  );

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  res.json({
    success: true,
    message: "Event updated",
    data: result.rows[0],
  });
};

/* ==================== SOFT DELETE ==================== */
exports.deleteEvent = async (req, res) => {
  const result = await EventModel.softDeleteEventAdmin(req.params.id);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "Event not found or already deleted",
    });
  }

  res.json({ success: true, message: "Event deleted" });
};

/* ==================== STATUS ACTIONS ==================== */

exports.publishEvent = async (req, res) => {
  const result = await EventModel.updateEventStatusAdmin(
    req.params.id,
    "published",
    ["draft"]
  );

  if (!result.rows.length) {
    return res.status(400).json({
      success: false,
      message: "Event cannot be published in current state",
    });
  }

  res.json({
    success: true,
    message: "Event published",
    data: result.rows[0],
  });
};

exports.unpublishEvent = async (req, res) => {
  const result = await EventModel.updateEventStatusAdmin(
    req.params.id,
    "draft",
    ["published"]
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
};

exports.cancelEvent = async (req, res) => {
  const result = await EventModel.updateEventStatusAdmin(
    req.params.id,
    "cancelled",
    ["draft", "published"]
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
};
