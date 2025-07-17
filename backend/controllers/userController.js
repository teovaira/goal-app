const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const registerUser = asyncHandler(async (req, res) => {

  const { name, password, email} = req.body;

  if (!name || !password ||!email) {
    res.status(400);
    throw new Error("Please add all fields.");
  };

  const userExists = await User.findOne({email});
  if (userExists) {
    res.status(400);
    throw new Error("User already exists.");
  }

  const SaltOrRounds = 10;
  const hashedPassword = await bcrypt.hash(password, SaltOrRounds);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword
  });

  if (newUser) {
    res.status(201).json({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data")
  };

});

module.exports = registerUser;