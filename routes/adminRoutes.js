const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("admin", "superAdmin"));

router.get("/events", asyncHandler(adminController.getAllEvents));
router.get("/events/:id", asyncHandler(adminController.getEventById));
router.post("/events", asyncHandler(adminController.createEvent));
router.put("/events/:id", asyncHandler(adminController.updateEvent));
router.patch("/events/:id", asyncHandler(adminController.updateEvent));
router.delete("/events/:id", asyncHandler(adminController.deleteEvent));

router.post("/events/:id/publish", asyncHandler(adminController.publishEvent));
router.post("/events/:id/unpublish", asyncHandler(adminController.unpublishEvent));
router.post("/events/:id/cancel", asyncHandler(adminController.cancelEvent));

module.exports = router;
