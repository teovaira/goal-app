require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Welcome to GoalApp API");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});