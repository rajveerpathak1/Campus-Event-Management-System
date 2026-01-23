const express = require("express");
const {
  getEvents,
  getEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEvent);

module.exports = router;
