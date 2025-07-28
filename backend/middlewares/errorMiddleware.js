const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    logger.debug(`Stack Trace: ${err.stack}`);
  }

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
