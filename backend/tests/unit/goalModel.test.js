/**
 * Goal Model Unit Tests
 * 
 * Purpose: This file tests our Goal database model to ensure it works correctly.
 * We test how goals are created, updated, and retrieved from the database.
 * 
 * What is being tested:
 * - Goal creation with default values
 * - Goal completion status tracking
 * - Finding goals based on their completion status
 * 
 * Why these tests matter:
 * - They ensure our database model behaves consistently
 * - They catch bugs before they reach production
 * - They document how the Goal model should work
 */

const Goal = require("../../models/goalModel");
const mongoose = require("mongoose");


describe("Goal Model Database Tests", () => {
  // Before each test, clear all goals to start fresh
  // This ensures tests don't interfere with each other
  beforeEach(async () => {
    await Goal.deleteMany({});
  });

  /**
   * Test 1: Default Goal Creation
   * WHY: When users create a new goal, it should start as incomplete
   * WHAT: Create a goal and check that 'completed' is false by default
   * HOW: This ensures new goals aren't accidentally marked as done
   */
  test("new goals should be marked as incomplete by default", async () => {
    // Create test data for a new goal
    const newGoalData = {
      text: "Learn JavaScript testing",
      user: new mongoose.Types.ObjectId() // Generate a fake user ID
    };

    // Create the goal in the database
    const createdGoal = await Goal.create(newGoalData);

    // Verify the goal was created correctly
    expect(createdGoal.completed).toBe(false); // Should be incomplete by default
    expect(createdGoal.text).toBe("Learn JavaScript testing");
  });

  /**
   * Test 2: Creating Completed Goals
   * WHY: Sometimes we need to create goals that are already completed (e.g., importing data)
   * WHAT: Create a goal with completed=true and verify it's saved correctly
   * HOW: This allows flexibility in goal creation for different use cases
   */
  test("should allow creating goals that are already completed", async () => {
    // Create a goal that's already marked as complete
    const completedGoalData = {
      text: "Finish backend setup",
      user: new mongoose.Types.ObjectId(),
      completed: true // Explicitly set as completed
    };

    // Save to database
    const completedGoal = await Goal.create(completedGoalData);

    // Verify it was saved as completed
    expect(completedGoal.completed).toBe(true);
    expect(completedGoal.text).toBe("Finish backend setup");
  });

  /**
   * Test 3: Updating Goal Completion Status
   * WHY: Users need to mark goals as complete when they achieve them
   * WHAT: Create an incomplete goal, update it to complete, and verify the change persists
   * HOW: This simulates the user checking off a goal in the app
   */
  test("should update a goal from incomplete to complete", async () => {
    // Step 1: Create an incomplete goal
    const incompleteGoalData = {
      text: "Read documentation",
      user: new mongoose.Types.ObjectId(),
      completed: false
    };

    const originalGoal = await Goal.create(incompleteGoalData);
    expect(originalGoal.completed).toBe(false); // Verify it starts incomplete

    // Step 2: Mark the goal as complete
    originalGoal.completed = true;
    await originalGoal.save();

    // Step 3: Fetch the goal again to ensure the change was saved
    const updatedGoalFromDatabase = await Goal.findById(originalGoal._id);
    expect(updatedGoalFromDatabase.completed).toBe(true);
  });

  /**
   * Test 4: Filtering Goals by Completion Status
   * WHY: Users want to see their completed goals separately from incomplete ones
   * WHAT: Create multiple goals and filter them by completion status
   * HOW: This tests the queries we'll use to show different goal lists in the UI
   */
  test("should correctly filter goals by completion status", async () => {
    // Create a test user ID (same for all goals)
    const testUserId = new mongoose.Types.ObjectId();
    
    // Create a mix of completed and incomplete goals
    const testGoals = [
      { text: "Completed Goal 1", user: testUserId, completed: true },
      { text: "Incomplete Goal 1", user: testUserId, completed: false },
      { text: "Completed Goal 2", user: testUserId, completed: true },
      { text: "Incomplete Goal 2", user: testUserId, completed: false }
    ];

    // Save all goals to database at once
    await Goal.create(testGoals);

    // Query for completed goals only
    const completedGoalsFromDatabase = await Goal.find({ 
      user: testUserId, 
      completed: true 
    });
    
    // Query for incomplete goals only
    const incompleteGoalsFromDatabase = await Goal.find({ 
      user: testUserId, 
      completed: false 
    });

    // Verify we got the right number of each type
    expect(completedGoalsFromDatabase.length).toBe(2);
    expect(incompleteGoalsFromDatabase.length).toBe(2);
    
    // Double-check that all completed goals are actually marked as complete
    const allCompletedGoalsAreComplete = completedGoalsFromDatabase.every(
      goal => goal.completed === true
    );
    expect(allCompletedGoalsAreComplete).toBe(true);
    
    // Double-check that all incomplete goals are actually marked as incomplete
    const allIncompleteGoalsAreIncomplete = incompleteGoalsFromDatabase.every(
      goal => goal.completed === false
    );
    expect(allIncompleteGoalsAreIncomplete).toBe(true);
  });
});