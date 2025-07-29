const passport = require("passport");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const logger = require("./config/logger");
require("./config/passport");
const express = require("express");
const app = express();
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const errorHandler = require("./middlewares/errorMiddleware");
const notFound = require("./middlewares/notFoundRouteMiddleware");
const goalRoutes = require("./routes/goalRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");



app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const logDirectory = path.join(__dirname, "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" }
);

app.use(morgan("combined", { stream: accessLogStream }));

app.use(
  morgan("dev", {
    skip: (req, res) => res.statusCode < 400,
    stream: {
      write: (message) => logger.error(message.trim()),
    },
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to GoalApp API");
});


app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});


app.use("/api/goals", goalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);


app.use(notFound);
app.use(errorHandler);


module.exports = app;

