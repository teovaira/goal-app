const express = require("express");
const router = express.Router();
const { getGoals, createGoal } = require("../controllers/goalController");

router.get("/", getGoals);
router.post("/", createGoal);

module.exports = router;