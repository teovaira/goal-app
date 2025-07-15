const getGoals = (req, res) => {
  res.status(200).json({message: "Get goals"});
  console.log("hit /api/goals")
};

const createGoals = async (req, res) => {
  console.log("Body received:", req.body);
  res.status(200).json({message: "Goal created"});
};

module.exports = {
  getGoals,
  createGoals
};