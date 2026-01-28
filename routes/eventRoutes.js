const express = require("express");
const {
  getEvents,
  getEvent,
//  register
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEvent);
//router.get("/:id/register",register);
module.exports = router;
