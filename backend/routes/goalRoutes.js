const express = require("express");
const router = express.Router();
const { getGoals, createGoal, updateGoal } = require("../controllers/goalController");

router.get("/", getGoals);
router.post("/", createGoal);
router.put("/:id", updateGoal);

module.exports = router;