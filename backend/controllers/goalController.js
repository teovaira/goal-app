const Goal = require("../models/goalModel")
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");


const getGoals = asyncHandler( async (req, res) => {
  console.log("GET request received at /api/goals.");

  const goals = await Goal.find({user: req.user.id});
  res.status(200).json(goals);
  console.log("hit /api/goals");
});

// const createGoal = (req, res) => {
//   try {
//       console.log("Body received: ", req.body);
//     if (!req.body || !req.body.text) {
//       return res.status(400).json({error: "Please add a text field."});
//     };

//       const goal = await Goal.create({
//       text: req.body.text,
//     });
//     res.status(201).json(goal);  

//   } catch (error) {
//       console.error("Error in creating goal: ", error.message);
//     return res.status(500).json({error: "Server error"});
//   }
  
//   };

const createGoal = asyncHandler(async (req,res) => {
  console.log("Body received: ", req.body);

  if (!req.body || !req.body.text) {
    res.status(400);
    throw new Error("Please add a text field.");
  }

  const goal = await Goal.create({
    text: req.body.text,
    user: req.user.id
  });

  res.status(201).json(goal);
});



  const updateGoal = asyncHandler(async (req, res) => {
    
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error("Invalid goal id.");
      }
      const goal = await Goal.findById(req.params.id);

      if(!goal) {
        console.log("Goal not found.");
        res.status(404);
        throw new Error("Goal not found.");
      };

      if (!req.body?.text) {
        console.log("Missing request body or text field.");
        res.status(400);
        throw new Error("Please add a text field.")
      };

      if (goal.user.toString() !== req.user.id) {
        res.status(403);
        throw new Error("Not authorized to update this goal");
      };

      const updatedGoal = await Goal.findByIdAndUpdate(req.params.id,
       {text: req.body.text},
       {new: true});

      res.status(200).json(updatedGoal);
    
      
    
  });

  const deleteGoal = asyncHandler( async (req,res) => {
    
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error("Invalid goal id.");
      };

      const goal = await Goal.findById(req.params.id);
      if (!goal) {
        res.status(404);
        throw new Error("Goal not found.");
      };

      const deletedGoal = await goal.deleteOne();

      res.status(200).json(
        "Goal successfully deleted."
      );

    
  });


module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
