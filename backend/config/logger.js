const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize, json } = format;
const path = require("path");

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const logFormat = printf(({ level, message, timestamp}) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const combinedRotate = new DailyRotateFile({
  filename: path.join("logs", "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  zippedArchive: true
});

const errorRotate = new DailyRotateFile({
  filename: path.join("logs", "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
  zippedArchive: true
});

const consoleFormat = isDevelopment
  ? combine(
      colorize(),
      timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
      logFormat
    )
  : combine(
      timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
      logFormat
    );

const fileFormat = combine(
  timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
  isProduction ? json() : logFormat
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  format: fileFormat,
  transports: [
    new transports.Console({ format: consoleFormat }),
    combinedRotate,
    errorRotate
  ]
});

module.exports = logger;