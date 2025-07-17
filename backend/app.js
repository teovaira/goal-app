const express = require("express");
const app = express();
const errorHandler = require("./middlewares/errorMiddleware");
const goalRoutes = require("./routes/goalRoutes");

app.use(express.json());

app.use("/api/goals", goalRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Welcome to GoalApp API");
});

module.exports = app;

