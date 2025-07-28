const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const generateToken = require("../utils/generateToken");
const logger = require("../config/logger");


const registerUser = asyncHandler(async (req, res) => {
  logger.info("POST /api/users - Registering user");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  if (!req.body) {
    logger.warn("Registration failed: Request body is missing");
    res.status(400);
    throw new Error("Request body is empty");
  }
  
  const { name, password, email } = req.body;

  if (!name || !password || !email) {
    logger.warn("Registration failed: Missing fields");
    res.status(400);
    throw new Error("Please add all fields.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    logger.warn(`Registration failed: User with email: ${email} already exists`);
    res.status(400);
    throw new Error("User already exists.");
  }

  const SaltOrRounds = 10;
  const hashedPassword = await bcrypt.hash(password, SaltOrRounds);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (newUser) {
    logger.info(`User with id: ${newUser._id} registered successfully`);
    res.status(201).json({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      token: generateToken(newUser._id)
    });
  } else {
    logger.error("Registration failed: Invalid user data");
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler( async (req, res) => {
  logger.info("POST /api/users/login - Attempting login");
  logger.debug(`Request body: ${ JSON.stringify(req.body)}`);
 const {email, password} = req.body;

 if (!req.body) {
  logger.warn("Login failed: Request body is missing");
  res.status(400);
  throw new Error("Request body is missing");
 }

 if(!email || !password) {
  logger.warn("Login failed: Password or email is missing")
  res.status(400);
  throw new Error("Please provide both email and password");
 }

 const user = await User.findOne({email});

 if (!user || !(await bcrypt.compare(password, user.password))) {
  logger.error(`Login failed: Invalid credentials for user with email: ${email}`);
  res.status(401);
  throw new Error("Invalid credentials");
 }

 logger.info(`User with id: ${user._id} logged in successfully`);

 res.status(200).json({
  message: "User logged in successfully",
  _id: user.id,
  name: user.name,
  email: user.email,
  token: generateToken(user.id)
 });



});

const getMe = asyncHandler( async (req, res) => {
  logger.info(`GET /api/users/me - Fetching profile for user with id: ${req.user?._id}`);
  

  if (!req.user) {
    logger.error("Fetching user profile failed: User not found")
  res.status(404);
  throw new Error("User not found");
  }

  res.status(200).json(req.user);
});


module.exports = {
  registerUser,
  loginUser,
  getMe
};