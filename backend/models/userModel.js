const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: The MongoDB auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 *       example:
 *         _id: 60f7c0d8b123456789abcdef
 *         name: Teo
 *         email: teo@example.com
 *         createdAt: 2025-07-22T10:00:00.000Z
 *         updatedAt: 2025-07-22T10:00:00.000Z
 */




const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please insert a name"],
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    email: {
      type: String,
      required: [true, "Please insert an email"],
      unique: true,
    }
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);