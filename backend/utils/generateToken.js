const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  console.log("Generating token with secret:", process.env.JWT_SECRET);
  return jwt.sign({id}, process.env.JWT_SECRET, {
    expiresIn: "2h"
  });
};

module.exports = generateToken;