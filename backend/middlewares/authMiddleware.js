const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const logger = require("../config/logger");

const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Authorization header missing or not using Bearer scheme");
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  const token = authHeader.split(" ")[1];
  logger.debug(`Received token: ${token}`);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug(`Decoded token: ${JSON.stringify(decoded)}`);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      logger.error("Token valid but user not found in database");
      res.status(401);
      throw new Error("Not authorized: user not found");
    }

    req.user = user;
    logger.info(`Authenticated request by user ${user._id}`);
    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }
});

module.exports = verifyToken;
