/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints for user registration, login, and logged in profile
 */

const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");


/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: fdshfder5
 *     responses:
 *       201:
 *         description: User registration successful
 *       400:
 *         description: Missing required fields or user already exists
 */

router.post("/", registerUser);


/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: dgjfggsdde56w46
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Missing fields
 *       401:
 *         description: Invalid credentials
 */


router.post("/login", loginUser);


/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The logged-in user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid token
 */

router.get("/me", verifyToken, getMe);

module.exports = router;
