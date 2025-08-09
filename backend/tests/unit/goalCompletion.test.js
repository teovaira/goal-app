const Goal = require("../../models/goalModel");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Goal Completion Feature", () => {
  beforeEach(async () => {
    await Goal.deleteMany({});
  });

  test("should create a goal with completed field defaulting to false", async () => {
    const goalData = {
      text: "Test goal",
      user: new mongoose.Types.ObjectId()
    };

    const goal = await Goal.create(goalData);

    expect(goal.completed).toBe(false);
    expect(goal.text).toBe("Test goal");
  });

  test("should create a goal with completed set to true", async () => {
    const goalData = {
      text: "Test completed goal",
      user: new mongoose.Types.ObjectId(),
      completed: true
    };

    const goal = await Goal.create(goalData);

    expect(goal.completed).toBe(true);
    expect(goal.text).toBe("Test completed goal");
  });

  test("should update goal completion status", async () => {
    const goalData = {
      text: "Goal to complete",
      user: new mongoose.Types.ObjectId(),
      completed: false
    };

    const goal = await Goal.create(goalData);
    expect(goal.completed).toBe(false);

    goal.completed = true;
    await goal.save();

    const updatedGoal = await Goal.findById(goal._id);
    expect(updatedGoal.completed).toBe(true);
  });

  test("should find all completed goals", async () => {
    const userId = new mongoose.Types.ObjectId();
    
    await Goal.create([
      { text: "Goal 1", user: userId, completed: true },
      { text: "Goal 2", user: userId, completed: false },
      { text: "Goal 3", user: userId, completed: true },
      { text: "Goal 4", user: userId, completed: false }
    ]);

    const completedGoals = await Goal.find({ user: userId, completed: true });
    const incompleteGoals = await Goal.find({ user: userId, completed: false });

    expect(completedGoals.length).toBe(2);
    expect(incompleteGoals.length).toBe(2);
    expect(completedGoals.every(goal => goal.completed)).toBe(true);
    expect(incompleteGoals.every(goal => !goal.completed)).toBe(true);
  });
});