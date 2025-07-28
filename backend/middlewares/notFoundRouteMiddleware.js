const logger = require("../config/logger");

const notFound = (req, res, next) => {
  const errorMessage = `Route: ${req.originalUrl} not found `;
  logger.warn(errorMessage);
  const error = new Error(errorMessage);
  res.status(404);
  next(error);
};

module.exports = notFound;
