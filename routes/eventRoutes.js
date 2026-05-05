const express = require("express");

const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const {
  getEvents,
  getEvent,
  register,
  unregister,
  getMyRegs,
} = require("../controllers/eventController");

const { validateEventIdParam } = require("../validators/event.validator");

const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */

// GET all events (public, but can personalize if logged in)
router.get("/", getEvents);



/* -------------------- USER ROUTES -------------------- */

// Get my registrations
router.get(
  "/my-registrations",
  requireAuth,
  authorizeRoles("student"),
  getMyRegs
);

// GET single event
router.get("/:id", validateEventIdParam, getEvent);


// Register for event
router.post(
  "/:id/register",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  register
);

// Unregister from event
router.delete(
  "/:id/unregister",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  unregister
);

module.exports = router;