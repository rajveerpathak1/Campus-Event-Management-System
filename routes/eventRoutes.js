const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const {
  getEvents,
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  getMyRegistrationsController, // ✅ added
} = require("../controllers/eventController");

const { validateEventIdParam } = require("../validators/event.validator");

const router = express.Router();

/* -------------------- GET ALL EVENTS -------------------- */
router.get("/", getEvents);

/* -------------------- GET MY REGISTRATIONS -------------------- */
// ⚠️ must be before "/:id"
router.get(
  "/my-registrations",
  requireAuth,
  authorizeRoles("student"),
  getMyRegistrationsController
);

/* -------------------- GET SINGLE EVENT -------------------- */
router.get("/:id", validateEventIdParam, getEvent);

/* -------------------- REGISTER -------------------- */
router.post(
  "/:id/register",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  registerForEvent
);

/* -------------------- UNREGISTER -------------------- */
router.delete(
  "/:id/unregister",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  unregisterFromEvent
);

module.exports = router;