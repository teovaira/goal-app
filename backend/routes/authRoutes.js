const passport = require("passport");
const express = require("express");
const router = express.Router();
const generateToken = require("../utils/generateToken");


router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));

router.get("/google/callback", passport.authenticate("google", {failureRedirect: "login", session: false}),
(req, res) => {
  const token = generateToken(req.user.id);

  res.status(200).json({
    message: "Google login successful",
    token,
    user: {
      name: req.user.name,
      email: req.user.email
    }
  });
});

module.exports = router;