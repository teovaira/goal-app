const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize } = format;
const path = require("path");


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

const logger = createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp(
      {format: "YYYY-MM-DD HH:mm:ss"},
    ),
    logFormat
  ),
  transports: [
    new transports.Console(),
    combinedRotate,
    errorRotate
  ]
});

module.exports = logger;