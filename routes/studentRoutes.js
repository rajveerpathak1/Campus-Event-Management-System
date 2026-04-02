const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { getMyRegistrations } = require("../controllers/eventController");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("student"));

router.get("/profile", (req, res) => {
  res.json({
    success: true,
    message: "Student profile",
    data: req.user,
  });
});
router.get("/registrations", getMyRegistrations);

module.exports = router;
