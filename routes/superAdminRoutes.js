const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const {
  getAllUsers,
  findUserById,
  updateUserRole,
} = require("../models/userModel");

const { getDB } = require("../config/db");

const router = express.Router();

router.use(requireAuth);
router.use(authorizeRoles("super-admin"));

/* -------------------- GET USERS -------------------- */
router.get("/users", asyncHandler(async (req, res) => {
  const users = await getAllUsers();

  res.json({
    success: true,
    count: users.length,
    data: users,
  });
}));

/* -------------------- GET USER -------------------- */
router.get("/users/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError(400, "Invalid ID");

  const user = await findUserById(id);
  if (!user) throw new ApiError(404, "User not found");

  res.json({ success: true, data: user });
}));

/* -------------------- UPDATE ROLE -------------------- */
router.patch("/users/:id/role", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;

  if (!["admin", "student"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  if (req.user.id === id) {
    throw new ApiError(400, "Cannot modify yourself");
  }

  const updated = await updateUserRole(id, role);

  if (!updated) throw new ApiError(404, "User not found");

  res.json({
    success: true,
    message: "Role updated",
    data: updated,
  });
}));

/* -------------------- DELETE USER -------------------- */
router.delete("/users/:id", asyncHandler(async (req, res) => {
  const db = getDB();
  const id = Number(req.params.id);

  if (!id) throw new ApiError(400, "Invalid ID");

  if (req.user.id === id) {
    throw new ApiError(400, "Cannot delete yourself");
  }

  try {
    await db.query("BEGIN");

    await db.query("DELETE FROM registrations WHERE user_id = $1", [id]);

    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "User not found");
    }

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "User deleted",
    });

  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}));

module.exports = router;