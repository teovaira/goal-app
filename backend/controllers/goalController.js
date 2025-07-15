const Goal = require("../models/goalModel")


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
  


module.exports = {
  getGoals,
  createGoal,
};
