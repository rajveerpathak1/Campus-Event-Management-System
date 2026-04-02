const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const adminController = require("../controllers/adminController");
const { getAllRegistrations } = require("../controllers/eventController");
const {
  validateEventIdParam,
  validateCreateEvent,
  validateUpdateEvent,
} = require("../validators/event.validator");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("admin", "superAdmin"));

router.get("/events", asyncHandler(adminController.getAllEvents));
router.get("/events/:id", validateEventIdParam, asyncHandler(adminController.getEventById));
router.post("/events", validateCreateEvent, asyncHandler(adminController.createEvent));
router.put("/events/:id", validateEventIdParam, validateUpdateEvent, asyncHandler(adminController.updateEvent));
router.patch("/events/:id", validateEventIdParam, validateUpdateEvent, asyncHandler(adminController.updateEvent));
router.delete("/events/:id", validateEventIdParam, asyncHandler(adminController.deleteEvent));

router.post("/events/:id/publish", validateEventIdParam, asyncHandler(adminController.publishEvent));
router.post("/events/:id/unpublish", validateEventIdParam, asyncHandler(adminController.unpublishEvent));
router.post("/events/:id/cancel", validateEventIdParam, asyncHandler(adminController.cancelEvent));

router.get("/registrations", getAllRegistrations);

module.exports = router;
