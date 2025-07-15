const express = require("express");
const router = express.Router();
const { getGoals, createGoals } = require("../controllers/goalController");

router.get("/", getGoals);
router.post("/", createGoals);

module.exports = router;