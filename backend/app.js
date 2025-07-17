const express = require("express");
const app = express();
const errorHandler = require("./middlewares/errorMiddleware");
const notFound = require("./middlewares/notFoundRouteMiddleware");
const goalRoutes = require("./routes/goalRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to GoalApp API");
});

app.use("/api/goals", goalRoutes);
app.use("/api/users", userRoutes);


// app.use((req, res, next) => {
//   res.status(404).json({message: "Route not found."});
// });

app.use(notFound);
app.use(errorHandler);


module.exports = app;

