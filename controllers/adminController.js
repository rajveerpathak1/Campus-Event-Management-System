const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const {
  getAllEventsAdmin,
  getEventByIdAdmin,
  createEventAdmin,
  updateEventAdmin,
  softDeleteEventAdmin,
  updateEventStatusAdmin,
} = require("../models/eventModel");

/* ==================== GET ALL EVENTS ==================== */
exports.getAllEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, start_date, end_date } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));
  const offset = (pageNum - 1) * limitNum;

  const result = await getAllEventsAdmin({
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
});

/* ==================== GET SINGLE EVENT ==================== */
exports.getEventById = asyncHandler(async (req, res) => {
  const event = await getEventByIdAdmin(req.params.id);

  if (!event || event.is_deleted) {
    throw new ApiError(404, "Event not found");
  }

  res.json({ success: true, data: event });
});

/* ==================== CREATE EVENT ==================== */
exports.createEvent = asyncHandler(async (req, res) => {
  const result = await createEventAdmin(req.body);

  res.status(201).json({
    success: true,
    message: "Event created",
    data: result.rows[0],
  });
});

/* ==================== UPDATE EVENT ==================== */
exports.updateEvent = asyncHandler(async (req, res) => {
  const allowedFields = ["title", "description", "event_date", "capacity"];
  const updates = [];
  const values = [];
  let idx = 1;

  if (req.user.role !== "super-admin" && "capacity" in req.body) {
    throw new ApiError(403, "Only super-admin can modify capacity");
  }

  for (const key of allowedFields) {
    if (key in req.body) {
      updates.push(`${key} = $${idx++}`);
      values.push(req.body[key]);
    }
  }

  if (!updates.length) {
    throw new ApiError(400, "No valid fields provided");
  }

  const result = await updateEventAdmin(
    req.params.id,
    updates,
    values
  );

  if (!result.rows.length) {
    throw new ApiError(404, "Event not found");
  }

  res.json({
    success: true,
    message: "Event updated",
    data: result.rows[0],
  });
});

/* ==================== DELETE ==================== */
exports.deleteEvent = asyncHandler(async (req, res) => {
  const result = await softDeleteEventAdmin(req.params.id);

  if (!result.rows.length) {
    throw new ApiError(404, "Event not found or already deleted");
  }

  res.json({ success: true, message: "Event deleted" });
});

/* ==================== STATUS ==================== */
exports.publishEvent = asyncHandler(async (req, res) => {
  const result = await updateEventStatusAdmin(
    req.params.id,
    "published",
    ["draft"]
  );

  if (!result.rows.length) {
    throw new ApiError(400, "Cannot publish event");
  }

  res.json({ success: true, data: result.rows[0] });
});

exports.unpublishEvent = asyncHandler(async (req, res) => {
  const result = await updateEventStatusAdmin(
    req.params.id,
    "draft",
    ["published"]
  );

  if (!result.rows.length) {
    throw new ApiError(400, "Cannot unpublish event");
  }

  res.json({ success: true, data: result.rows[0] });
});

exports.cancelEvent = asyncHandler(async (req, res) => {
  const result = await updateEventStatusAdmin(
    req.params.id,
    "cancelled",
    ["draft", "published"]
  );

  if (!result.rows.length) {
    throw new ApiError(400, "Cannot cancel event");
  }

  res.json({ success: true, data: result.rows[0] });
});