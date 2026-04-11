const asyncHandler = require("../utils/asyncHandler");
const { searchEvents, getEventByIdStudent } = require("../models/eventModel");

const {
  registerForEvent: registerForEventService,
  getMyRegistrations: getMyRegistrationsService,
  getAllRegistrations: getAllRegistrationsService,
  unregisterForEvent: unregisterForEventService,
} = require("../models/registrationModel");

// 🔥 renamed to avoid conflict
const {
  getMyRegistrations: getMyRegistrationsFromModel,
} = require("../models/eventModel");

const ApiError = require("../utils/ApiError");

/* -------------------- GET EVENTS -------------------- */
const getEvents = asyncHandler(async (req, res) => {
  let { search = "", limit = 10, page = 1 } = req.query;

  limit = Math.min(50, Math.max(1, Number(limit) || 10));
  page = Math.max(1, Number(page) || 1);

  const offset = (page - 1) * limit;

  const result = await searchEvents({ search, limit, offset });

  res.status(200).json({
    success: true,
    page,
    limit,
    total: Number(result.total),
    count: result.rows.length,
    data: result.rows,
  });
});

/* -------------------- GET EVENT -------------------- */
const getEvent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError(400, "Invalid event ID");

  const event = await getEventByIdStudent(id);
  if (!event) throw new ApiError(404, "Event not found");

  res.status(200).json({ success: true, data: event });
});

/* -------------------- REGISTER -------------------- */
const registerForEvent = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);

  if (!userId) throw new ApiError(401, "Not authenticated");
  if (!eventId) throw new ApiError(400, "Invalid event ID");

  const result = await registerForEventService({ userId, eventId });

  res.status(201).json({
    success: true,
    message: "Registered successfully",
    data: result,
  });
});

/* -------------------- MY REGISTRATIONS -------------------- */
const getMyRegistrations = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Not authenticated");

  const data = await getMyRegistrationsService(userId);

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

/* -------------------- ALL REGISTRATIONS -------------------- */
const getAllRegistrations = asyncHandler(async (req, res) => {
  let { eventId, page = 1, limit = 20 } = req.query;

  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (page - 1) * limit;

  const data = await getAllRegistrationsService({
    eventId: eventId ? Number(eventId) : undefined,
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    page,
    limit,
    count: data.length,
    data,
  });
});

/* -------------------- UNREGISTER -------------------- */
const unregisterFromEvent = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const eventId = Number(req.params.id);

  if (!userId) throw new ApiError(401, "Not authenticated");
  if (!eventId) throw new ApiError(400, "Invalid event ID");

  const result = await unregisterForEventService({ userId, eventId });

  res.status(200).json({
    success: true,
    message: "Unregistered successfully",
    data: result,
  });
});

/* -------------------- MY REGISTRATIONS (ALT CONTROLLER) -------------------- */
const getMyRegistrationsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await getMyRegistrationsFromModel(userId);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};

/* -------------------- EXPORTS -------------------- */
module.exports = {
  getEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  getMyRegistrations,
  getAllRegistrations,
  getMyRegistrationsController,
};