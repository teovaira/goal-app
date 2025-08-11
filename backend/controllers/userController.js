const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const generateToken = require("../utils/generateToken");
const logger = require("../config/logger");
const { OAuth2Client } = require("google-auth-library");
const { validatePassword, getPasswordErrorMessage } = require("../utils/passwordValidator");
const { sanitizeRequestBody } = require("../utils/logSanitizer");


const registerUser = asyncHandler(async (req, res) => {
  logger.info("POST /api/users - Registering user");
  logger.debug(`Request body: ${JSON.stringify(sanitizeRequestBody(req.body))}`);

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

  if (!validatePassword(password)) {
    logger.warn("Registration failed: Password does not meet requirements");
    res.status(400);
    throw new Error(getPasswordErrorMessage());
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    logger.warn(`Registration failed: User already exists`);
    res.status(400);
    throw new Error("User already exists.");
  }

  const SaltOrRounds = 10;
  const hashedPassword = await bcrypt.hash(password, SaltOrRounds);

  try {
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      logger.info(`User with id: ${newUser._id} registered successfully`);
      res.status(201).json({
        token: generateToken(newUser._id),
        user: {
          _id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    } else {
      logger.error("Registration failed: Invalid user data");
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    if (error.name === 'ValidationError' && error.errors && error.errors.email) {
      logger.warn(`Registration failed: ${error.message}`);
      res.status(400);
      throw new Error("Please provide a valid email address");
    }
    throw error;
  }
});

const loginUser = asyncHandler( async (req, res) => {
  logger.info("POST /api/users/login - Attempting login");
  logger.debug(`Request body: ${ JSON.stringify(sanitizeRequestBody(req.body))}`);
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
  logger.error(`Login failed: Invalid credentials`);
  res.status(401);
  throw new Error("Invalid email or password");
 }

 logger.info(`User with id: ${user._id} logged in successfully`);

 res.status(200).json({
  message: "User logged in successfully",
  token: generateToken(user.id),
  user: {
    _id: user.id,
    name: user.name,
    email: user.email
  }
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

const googleLogin = asyncHandler(async (req, res) => {
  logger.info("POST /api/users/google-login - Attempting Google login");
  
  const { token } = req.body;
  
  if (!token || typeof token !== 'string') {
    logger.warn("Google login failed: Token is missing or invalid");
    res.status(400);
    throw new Error("Google token is required");
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleID = payload.sub;
    const email = payload.email;
    const name = payload.name;
    
    const user = await User.findOne({ googleID });
    
    if (!user) {
      logger.warn(`Google login failed: No user found with Google ID: ${googleID}`);
      res.status(404);
      throw new Error("User not found. Please register first.");
    }
    
    logger.info(`User with id: ${user._id} logged in successfully via Google`);
    
    res.status(200).json({
      message: "User logged in successfully",
      token: generateToken(user.id),
      user: {
        _id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    // If it's our custom "User not found" error, preserve the 404 status
    if (error.message === "User not found. Please register first." && res.statusCode === 404) {
      throw error;
    }
    
    logger.error(`Google login failed: ${error.message}`);
    res.status(401);
    throw new Error("Invalid Google token");
  }
});

const googleRegister = asyncHandler(async (req, res) => {
  logger.info("POST /api/users/google-register - Attempting Google registration");
  
  const { token } = req.body;
  
  if (!token || typeof token !== 'string') {
    logger.warn("Google registration failed: Token is missing or invalid");
    res.status(400);
    throw new Error("Google token is required");
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const googleID = payload.sub;
    const email = payload.email;
    const name = payload.name;
    
    const existingUser = await User.findOne({
      $or: [{ googleID }, { email }]
    });
    
    if (existingUser) {
      logger.warn(`Google registration failed: User already exists`);
      res.status(400);
      throw new Error("User already exists");
    }
    
    const newUser = await User.create({
      name,
      email,
      googleID
    });
    
    if (newUser) {
      logger.info(`User with id: ${newUser._id} registered successfully via Google`);
      res.status(201).json({
        token: generateToken(newUser._id),
        user: {
          _id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    } else {
      logger.error("Google registration failed: Unable to create user");
      res.status(400);
      throw new Error("Failed to create user");
    }
    
  } catch (error) {
    // If it's our custom error, preserve the status code
    if ((error.message === "User already exists" && res.statusCode === 400) ||
        (error.message === "Failed to create user" && res.statusCode === 400)) {
      throw error;
    }
    
    logger.error(`Google registration failed: ${error.message}`);
    res.status(401);
    throw new Error("Invalid Google token");
  }
});


module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  googleRegister
};