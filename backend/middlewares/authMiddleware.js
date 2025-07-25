const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");


  
  
  const verifyToken = asyncHandler( async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Received token:", token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      req.user = await User.findById(decoded.id).select("-password");
      console.log("Authenticated user:", req.user);

      next();
    } catch (error) {

      res.status(401);
      throw new Error("Not authorized, token invalid or expired");
    }
    
  };

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided")
  };

});

module.exports = verifyToken;