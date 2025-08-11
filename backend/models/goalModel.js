/**
 * @swagger
 * components:
 *   schemas:
 *     Goal:
 *       type: object
 *       required:
 *         - user
 *         - text
 *       properties:
 *         _id:
 *           type: string
 *           description: The mongodb auto-generated id of the goal
 *         user:
 *           type: string
 *           description: The id of the user who created the goal
 *         text:
 *           type: string
 *           description: The goal content
 *         completed:
 *           type: boolean
 *           description: Whether the goal has been completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: 60f7c0d8b123456789abcdef
 *         user: 60f7c0d8b123456789abcdea
 *         text: Learn Swagger
 *         completed: false
 *         createdAt: 2025-07-22T10:00:00.000Z
 *         updatedAt: 2025-07-22T10:00:00.000Z
 */

const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    text: {
      type: String,
      required: [true, "Please add a text value"],
      maxlength: [1000, "Goal text cannot exceed 1000 characters"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Goal", goalSchema);
