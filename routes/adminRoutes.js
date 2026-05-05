/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin APIs
 */

const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const adminController = require("../controllers/adminController");
const { getAllRegs } = require("../controllers/eventController");
const {
  validateEventIdParam,
  validateCreateEvent,
  validateUpdateEvent,
} = require("../validators/event.validator");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("admin", "super-admin"));


/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: Get all events
 *     tags: [Admin]
 */

router.get("/events", asyncHandler(adminController.getAllEvents));

/**
 * @swagger
 * /admin/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Admin]
 */

router.get("/events/:id", validateEventIdParam, asyncHandler(adminController.getEventById));

/**
 * @swagger
 * /admin/events:
 *   post:
 *     summary: Create event
 *     tags: [Admin]
 */

router.post("/events", validateCreateEvent, asyncHandler(adminController.createEvent));

/**
 * @swagger
 * /admin/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Admin]
 */


router.put("/events/:id", validateEventIdParam, validateUpdateEvent, asyncHandler(adminController.updateEvent));

/**
 * @swagger
 * /admin/events/{id}:
 *   patch:
 *     summary: Update event
 *     tags: [Admin]
 */



router.patch("/events/:id", validateEventIdParam, validateUpdateEvent, asyncHandler(adminController.updateEvent));


/**
 * @swagger
 * /admin/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Admin]
 */

router.delete("/events/:id", validateEventIdParam, asyncHandler(adminController.deleteEvent));


/**
 * @swagger
 * /admin/events/{id}/publish:
 *   post:
 *     summary: Publish event
 *     tags: [Admin]
 */

router.post("/events/:id/publish", validateEventIdParam, asyncHandler(adminController.publishEvent));


/**
 * @swagger
 * /admin/events/{id}/unpublish:
 *   post:
 *     summary: Unpublish event
 *     tags: [Admin]
 */
router.post("/events/:id/unpublish", validateEventIdParam, asyncHandler(adminController.unpublishEvent));

/**
 * @swagger
 * /admin/events/{id}/cancel:
 *   post:
 *     summary: Cancel event
 *     tags: [Admin]
 */
router.post("/events/:id/cancel", validateEventIdParam, asyncHandler(adminController.cancelEvent));


/**
 * @swagger
 * /admin/registrations:
 *   get:
 *     summary: Get all registrations
 *     tags: [Admin]
 */
router.get("/registrations", getAllRegs);

module.exports = router;
