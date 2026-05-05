/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Student APIs
 */

const express = require("express");

const requireAuth = require("../middlewares/requireAuth");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const { findUserById } = require("../models/userModel");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const router = express.Router();

// Apply auth globally
router.use(requireAuth);
router.use(authorizeRoles("student"));


/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Student]
 *     responses:
 *       200:
 *         description: Profile data
 */

/* -------------------- GET PROFILE -------------------- */
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await findUserById(userId);

    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

module.exports = router;