const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

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

module.exports = router;
