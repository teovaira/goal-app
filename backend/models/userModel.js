const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - password
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: The mongodb auto-generated id of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         password:
 *           type: string
 *           description: The hashed password of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *          _id: 60f7c0d8b123456789abcdef
 *          name: Teo
 *          password: $2a$10$abc123hashedpassword
 *          email: teo@example.com
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