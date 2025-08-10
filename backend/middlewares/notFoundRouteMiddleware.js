const logger = require("../config/logger");

const notFound = (req, res, next) => {
  logger.warn(`404 - Not Found: ${req.originalUrl}`);
  
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = notFound;
