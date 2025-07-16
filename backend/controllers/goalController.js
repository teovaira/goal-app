const Goal = require("../models/goalModel")
const mongoose = require("mongoose");


const getGoals = (req, res) => {
  res.status(200).json({ message: "Get goals" });
  console.log("hit /api/goals");
};

const createGoal = async (req, res) => {
  try {
      console.log("Body received: ", req.body);
    if (!req.body || !req.body.text) {
      return res.status(400).json({error: "Please add a text field."});
    };

      const goal = await Goal.create({
      text: req.body.text,
    });
    res.status(201).json(goal);  

  } catch (error) {
      console.error("Error in creating goal: ", error.message);
    res.status(500).json({error: "Server error"});
  }
  
  };

  const updateGoal = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid goal id."});
      }
      const goal = await Goal.findById(req.params.id);

      if(!goal) {
        return res.status(404).json({"error": "Goal not found."});
      };

      const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {new: true});

      res.status(200).json(updatedGoal);
    } catch (error) {
      console.error(`Error in updating goal with id: ${req.params.id}, ${error.message}`);
      res.status(500).json({"error": "Server error."})
    }
  };

  const deleteGoal = async (req,res) => {
    
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid goal id." });
      }
      const goal = await Goal.findById(req.params.id);
      if (!goal) {
        return res.status(404).json({error: "Goal not found"});
      };

      const deletedGoal = await goal.deleteOne();

      res
        .status(200)
        .json({
          message: `Goal with id ${req.params.id} deleted successfully`});

    } catch (error) {

      console.error("Error in deleting goal: ", error.message);
      res.status(500).json({error: "server error"});

    };
  }  


module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
