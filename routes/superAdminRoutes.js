const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  getAllUsers,
  findUserById,
  updateUserRole,
} = require("../models/userModel");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("superAdmin"));

/* -------------------- GET ALL USERS -------------------- */
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  })
);

/* -------------------- GET USER BY ID -------------------- */
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  })
);

/* -------------------- PROMOTE USER -------------------- */
router.patch(
  "/users/:id/promote",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body;

    if (!["student", "admin", "superAdmin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const updatedUser = await updateUserRole(id, role);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User role updated",
      data: updatedUser,
    });
  })
);

module.exports = router;
