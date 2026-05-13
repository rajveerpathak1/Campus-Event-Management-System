/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Student APIs
 */

const express = require("express");

const requireAuth = require("../middlewares/requireAuth");

const {
  authorizeRoles,
} = require("../middlewares/roleMiddleware");

const {
  findUserById,
} = require("../models/userModel");

const {
  getMyRegs,
} = require("../controllers/eventController");

const asyncHandler = require("../utils/asyncHandler");

const ApiError = require("../utils/ApiError");

const router = express.Router();

/* ================================================= */
/* AUTH */
/* ================================================= */

router.use(requireAuth);

router.use(authorizeRoles("student"));

/* ================================================= */
/* PROFILE */
/* ================================================= */

/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Student]
 */

router.get(
  "/profile",

  asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(
        401,
        "Unauthorized"
      );
    }

    const user = await findUserById(
      userId
    );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

/* ================================================= */
/* MY REGISTRATIONS */
/* ================================================= */

/**
 * @swagger
 * /students/registrations:
 *   get:
 *     summary: Get student registrations
 *     tags: [Student]
 */

router.get(
  "/registrations",
  asyncHandler(getMyRegs)
);

module.exports = router;
