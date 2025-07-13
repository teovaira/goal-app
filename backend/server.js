require("dotenv").config();

const express = require("express");
const connectToMongoDB = require("./config/db.js")
const app = express();
const PORT = process.env.PORT;


app.get("/", (req, res) => {
  res.send("Welcome to GoalApp API");
});

const startServer = async () => {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
  } catch (error) {
    console.error("Connection to MongoDB failed: ", error.message);
    process.exit(1);
  }
};

startServer();

