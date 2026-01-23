const asyncHandler = require("../utils/asyncHandler");
const {
  searchEvents,
  getEventById,
} = require("../models/eventModel");

/* -------------------- GET EVENTS (SEARCH) -------------------- */
exports.getEvents = asyncHandler(async (req, res) => {
  let { search = "", limit = 10 } = req.query;

  limit = Number(limit);
  if (isNaN(limit) || limit <= 0) limit = 10;
  if (limit > 50) limit = 50;

  const events = await searchEvents({ search, limit });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

/* -------------------- GET EVENT BY ID -------------------- */
exports.getEvent = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    const err = new Error("Invalid event ID");
    err.status = 400;
    throw err;
  }

  const event = await getEventById(id);

  if (!event) {
    const err = new Error("No event found with the given ID");
    err.status = 404;
    throw err;
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});
