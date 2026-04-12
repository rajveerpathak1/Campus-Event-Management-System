const express = require("express");
const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const {
  getAllUsers,
  findUserById,
  updateUserRole,
} = require("../models/userModel");

// ✅ FIX: import getDB
const { getDB } = require("../config/db");

const router = express.Router();

/* -------------------- CONSTANTS -------------------- */
const ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
};

/* -------------------- MIDDLEWARE -------------------- */
router.use(requireAuth);
router.use(authorizeRoles("superAdmin"));

/* -------------------- HELPERS -------------------- */
const validateId = (id, res) => {
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
    return false;
  }
  return true;
};

const preventSelfAction = (req, id, res, action) => {
  // ✅ SAFE CHECK (no crash)
  if (!req.session?.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return false;
  }

  if (req.session.user.id === id) {
    res.status(400).json({
      success: false,
      message: `You cannot ${action} yourself`,
    });
    return false;
  }

  return true;
};

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
    if (!validateId(id, res)) return;

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, data: user });
  })
);

/* -------------------- PROMOTE USER -------------------- */
router.patch(
  "/users/:id/promote",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!validateId(id, res)) return;
    if (!preventSelfAction(req, id, res, "modify role of")) return;

    const updatedUser = await updateUserRole(id, ROLES.ADMIN);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User promoted to admin",
      data: updatedUser,
    });
  })
);

/* -------------------- DEMOTE USER -------------------- */
router.patch(
  "/users/:id/demote",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!validateId(id, res)) return;
    if (!preventSelfAction(req, id, res, "modify role of")) return;

    const updatedUser = await updateUserRole(id, ROLES.STUDENT);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User demoted to student",
      data: updatedUser,
    });
  })
);

/* -------------------- DELETE USER -------------------- */
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const db = getDB();
    const id = Number(req.params.id);

    if (!validateId(id, res)) return;
    if (!preventSelfAction(req, id, res, "delete")) return;

    // ✅ handle FK (important if user registered in events)
    await db.query("BEGIN");

    await db.query("DELETE FROM registrations WHERE user_id = $1", [id]);

    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    await db.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  })
);

module.exports = router;