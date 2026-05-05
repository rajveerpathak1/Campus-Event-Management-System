/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event APIs
 */

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

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 */
// GET all events (public, but can personalize if logged in)
router.get("/", getEvents);



/* -------------------- USER ROUTES -------------------- */
/**
 * @swagger
 * /events/my-registrations:
 *   get:
 *     summary: Get my event registrations
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of my registrations
 *
 *     
 */


// Get my registrations
router.get(
  "/my-registrations",
  requireAuth,
  authorizeRoles("student"),
  getMyRegs
);


/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details
 */
// GET single event
router.get("/:id", validateEventIdParam, getEvent);



/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register for event
 *     tags: [Events]
 *     responses:
 *       201:
 *         description: Registered successfully
 */
// Register for event
router.post(
  "/:id/register",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  register
);


/**
 * @swagger
 * /events/{id}/unregister:
 *   delete:
 *     summary: Unregister from event
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Unregistered
 */
// Unregister from event
router.delete(
  "/:id/unregister",
  requireAuth,
  authorizeRoles("student"),
  validateEventIdParam,
  unregister
);

module.exports = router;