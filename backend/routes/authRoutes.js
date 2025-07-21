const passport = require("passport");
const express = require("express");
const router = express.Router();


router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}));

router.get("/google/callback", passport.authenticate("google", {session: false, failureRedirect: "login"}),
(req, res) => {
  res.status(200).json({
    message: "Logged in via Google",
    user: req.user
  });
}
);

module.exports = router;