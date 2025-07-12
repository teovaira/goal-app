const express = require("express");
const app = express();
const port = 5000;

app.get("/", (req, res) => {
  res.send("Welcome to GoalApp API");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});