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
const rfs = require("rotating-file-stream");

const errorHandler = require("./middlewares/errorMiddleware");
const notFound = require("./middlewares/notFoundRouteMiddleware");
const goalRoutes = require("./routes/goalRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");



const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'https://your-app.com']
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5000'
        ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(passport.initialize());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const logDirectory = path.join(__dirname, "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: logDirectory,
  maxFiles: 14,
  compress: "gzip"
});

app.use(morgan("combined", { stream: accessLogStream }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

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

