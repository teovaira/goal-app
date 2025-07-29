const Goal = require("../models/goalModel")
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const logger = require("../config/logger");


const getGoals = asyncHandler( async (req, res) => {
  logger.info("Get /api/goals - Fetching user goals");

  const goals = await Goal.find({user: req.user.id});
  logger.info(`User ${req.user.id} retrieved ${goals.length} goals.`);
  res.status(200).json(goals);
});


const createGoal = asyncHandler(async (req,res) => {
  logger.info("Post /api/goals - Creating new goal");
  logger.debug(`Request body: ${JSON.stringify(req.body)}`);

  if (!req.body || !req.body.text) {
    logger.warn("Goal creation failed: missing text field");
    res.status(400);
    throw new Error("Please add a text field.");
  }

  const goal = await Goal.create({
    text: req.body.text,
    user: req.user.id
  });

  logger.info(`Goal created for user ${req.user.id} with id: ${goal._id}`);

  res.status(201).json(goal);
});



  const updateGoal = asyncHandler(async (req, res) => {
      logger.info(`PUT /api/goals/${req.params.id} - Attempting update`);

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        logger.warn("Invalid goal ID");
        res.status(400);
        throw new Error("Invalid goal id.");
      }
      const goal = await Goal.findById(req.params.id);

      if(!goal) {
        logger.warn(`Goal with id: ${req.params.id} not found.`);
        res.status(404);
        throw new Error("Goal not found.");
      };

      if (!req.body?.text) {
        logger.warn("Missing request body or text field in the update request");
        res.status(400);
        throw new Error("Please add a text field.")
      };

      if (goal.user.toString() !== req.user.id) {
        logger.error(
          `User ${req.user.id} not authorized to update goal with id: ${req.params.id}`
        );
        res.status(403);
        throw new Error("Not authorized to update this goal");
      };

      const updatedGoal = await Goal.findByIdAndUpdate(req.params.id,
       {text: req.body.text},
       {new: true});

       logger.info(`Goal with id: ${req.params.id} updated by user ${req.user.id}`);

      res.status(200).json(updatedGoal);
    
      
    
  });

  const deleteGoal = asyncHandler( async (req,res) => {
    logger.info(`DELETE /api/goals/${req.params.id} - Attempting deletion`);
    
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        logger.warn("Invalid goal ID");
        res.status(400);
        throw new Error("Invalid goal id.");
      };

      const goal = await Goal.findById(req.params.id);
      if (!goal) {
        logger.warn(`Goal with id:b${req.params.id} not found for deletion.`);
        res.status(404);
        throw new Error("Goal not found.");
      };

      if (goal.user.toString() !== req.user.id) {
        logger.error(
          `User ${req.user.id} not authorized to delete goal with id: ${req.params.id}`
        );
        res.status(403);
        throw new Error("Not authorized to delete this goal");
      }

      const deletedGoal = await goal.deleteOne();

      logger.info(`Goal with id: ${req.params.id} deleted by user ${req.user.id}`);

      res.status(200).json({
        message: "Goal successfully deleted.", 
        goal: deletedGoal
      });
    

    
  });


module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
