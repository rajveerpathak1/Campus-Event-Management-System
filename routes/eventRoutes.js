/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event APIs
 */

const express = require("express");

const requireAuth = require("../middlewares/requireAuth");
const optionalAuth = require("../middlewares/optionalAuth");
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
 *     summary: Get all published events (public route)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search query matching event titles
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page (max 50)
 *     responses:
 *       200:
 *         description: List of published events retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */
// GET all events (public, but can personalize if logged in)
router.get("/", optionalAuth, getEvents);



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
 *     summary: Get a single published event by ID (public route)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event database ID
 *     responses:
 *       200:
 *         description: Published event details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid event ID provided.
 *       404:
 *         description: Published event not found or is soft-deleted.
 */
// GET single event
router.get("/:id", optionalAuth, validateEventIdParam, getEvent);



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