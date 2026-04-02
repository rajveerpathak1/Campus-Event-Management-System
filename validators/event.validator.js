const ApiError = require("../utils/ApiError");

const toInt = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const validateEventIdParam = (req, res, next) => {
  const id = toInt(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return next(new ApiError(400, "Invalid event ID"));
  }
  next();
};

const validateCreateEvent = (req, res, next) => {
  const { title, description, event_date, capacity } = req.body || {};

  if (!title) return next(new ApiError(400, "title is required"));
  if (!event_date) return next(new ApiError(400, "event_date is required"));

  const dt = new Date(event_date);
  if (Number.isNaN(dt.getTime())) {
    return next(new ApiError(400, "event_date must be a valid date"));
  }

  if (typeof capacity === "undefined") {
    return next(new ApiError(400, "capacity is required"));
  }

  const cap = toInt(capacity);
  if (!Number.isInteger(cap) || cap < 0) {
    return next(new ApiError(400, "capacity must be a non-negative integer"));
  }

  next();
};

const validateUpdateEvent = (req, res, next) => {
  const allowedFields = ["title", "description", "event_date", "capacity"];
  const body = req.body || {};
  const keys = Object.keys(body);

  if (keys.length === 0) return next(new ApiError(400, "Request body cannot be empty"));

  const invalid = keys.filter(k => !allowedFields.includes(k));
  if (invalid.length) {
    return next(new ApiError(400, `Invalid fields: ${invalid.join(", ")}`));
  }

  if ("event_date" in body) {
    const dt = new Date(body.event_date);
    if (Number.isNaN(dt.getTime())) {
      return next(new ApiError(400, "event_date must be a valid date"));
    }
  }

  if ("capacity" in body) {
    const cap = toInt(body.capacity);
    if (!Number.isInteger(cap) || cap < 0) {
      return next(new ApiError(400, "capacity must be a non-negative integer"));
    }
  }

  next();
};

module.exports = {
  validateEventIdParam,
  validateCreateEvent,
  validateUpdateEvent,
};

