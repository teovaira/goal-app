const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const generateToken = (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });

  logger.debug(`Generated token for user ${userId}`);
  return token;
};

module.exports = generateToken;
