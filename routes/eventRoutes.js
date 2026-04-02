const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const {
  getEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
} = require("../controllers/eventController");
const { validateEventIdParam } = require("../validators/event.validator");

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", validateEventIdParam, getEvent);

// Student registration
router.post(
  "/:id/register",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  // Controller is already asyncHandler-wrapped, so no extra wrapping needed
  registerForEvent
);

// Student unregister
router.delete(
  "/:id/unregister",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  unregisterFromEvent
);

module.exports = router;
