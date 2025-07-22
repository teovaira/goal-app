/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Google OAuth endpoints
 */

const passport = require("passport");
const express = require("express");
const router = express.Router();
const generateToken = require("../utils/generateToken");


/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth login process
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback URL
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Google login successful, returns JWT token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Google login successful
 *                 token:
 *                   type: string
 *                   example: the returned jwt token
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *       401:
 *         description: Unauthorized - Google login failed
 */


router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "login", session: false }),
  (req, res) => {
    const token = generateToken(req.user.id);

    res.status(200).json({
      message: "Google login successful",
      token,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  }
);

module.exports = router;
