const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please insert a name"],
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    email: {
      type: String,
      required: [true, "Please insert an email"],
      unique: true,
    }
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);