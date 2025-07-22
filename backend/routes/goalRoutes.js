
/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Endpoints for managing goals
 */


const express = require("express");
const router = express.Router();

const { getGoals, createGoal, updateGoal, deleteGoal } = require("../controllers/goalController");

const verifyToken = require("../middlewares/authMiddleware");


/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Get all goals of the logged-in user
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user goals
 *       401:
 *         description: Unauthorized
 */


router
  .route("/")
  .get(verifyToken, getGoals)

  /**
   * @swagger
   * /api/goals:
   *   post:
   *     summary: Create a new goal
   *     tags: [Goals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               text:
   *                 type: string
   *                 example: Twice a week i will be going to the gym
   *     responses:
   *       201:
   *         description: Goal created successfully
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   */


  .post(verifyToken, createGoal);


  /**
   * @swagger
   * /api/goals/{id}:
   *   put:
   *     summary: Update a goal by ID
   *     tags: [Goals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The goal ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               text:
   *                 type: string
   *                 example: Updated goal text
   *     responses:
   *       200:
   *         description: Goal updated
   *       400:
   *         description: Invalid ID or data
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Goal not found
   */


  router
    .route("/:id")
    .put(verifyToken, updateGoal)

    /**
     * @swagger
     * /api/goals/{id}:
     *   delete:
     *     summary: Delete a goal by ID
     *     tags: [Goals]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: The goal ID
     *     responses:
     *       200:
     *         description: Goal deleted
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Goal not found
     */


  .delete(verifyToken, deleteGoal);

module.exports = router;