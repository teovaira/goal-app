const express = require("express");
const router = express.Router();

const { getGoals, createGoal, updateGoal, deleteGoal } = require("../controllers/goalController");

const verifyToken = require("../middlewares/authMiddleware");

router.route("/")
  .get(verifyToken, getGoals)
  .post(verifyToken, createGoal);

router
  .route("/:id")
    .put(verifyToken, updateGoal)
    .delete(verifyToken, deleteGoal);

module.exports = router;