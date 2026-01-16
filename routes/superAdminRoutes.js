const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

router.use(auth);
router.use(authorizeRoles("superAdmin"));

router.post("/", async (req, res) => {
  res.json({ message: "SuperAdmin root route" });
});

router.post("/promote", (req, res) => {
  res.json({ message: "User promoted" });
});

module.exports = router;
