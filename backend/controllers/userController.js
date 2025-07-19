const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const generateToken = require("../utils/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  if (!req.body) {
    res.status(400);
    throw new Error("Request body is empty");
  }
  
  const { name, password, email } = req.body;

  if (!name || !password || !email) {
    res.status(400);
    throw new Error("Please add all fields.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
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
    res.status(201).json({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler( async (req, res) => {
 const {email, password} = req.body;

 if (!req.body) {
  res.status(400);
  throw new Error("Request body is missing");
 }

 if(!email || !password) {
  res.status(400);
  throw new Error("Please provide both email and password");
 }

 const user = await User.findOne({email});

 if (!user || !(await bcrypt.compare(password, user.password))) {
  res.status(401);
  throw new Error("Invalid credentials");
 }

 res.status(200).json({
  message: "User logged in successfully",
  _id: user.id,
  name: user.name,
  email: user.email,
  token: generateToken(user.id)
 });



});


module.exports = {
  registerUser,
  loginUser
};