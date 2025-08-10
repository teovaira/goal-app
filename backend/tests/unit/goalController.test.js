/**
 * Goal Controller Tests - Junior Friendly Version
 * 
 * What is this file?
 * This file tests all the API endpoints (URLs) related to goals in our app.
 * Think of it as testing all the buttons and features users can use for goals.
 * 
 * What endpoints do we test?
 * - GET    /api/goals       → Get all goals for a user
 * - POST   /api/goals       → Create a new goal
 * - PUT    /api/goals/:id   → Update a goal (text or completion status)
 * - DELETE /api/goals/:id   → Delete a goal
 * 
 * Key Concepts for Juniors:
 * - API Endpoint: A URL that our app responds to (like /api/goals)
 * - HTTP Methods: GET (read), POST (create), PUT (update), DELETE (remove)
 * - Status Codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 404 (not found)
 * - Authorization: Making sure users can only see/edit their own goals
 * 
 * Testing Strategy:
 * We test each endpoint with:
 * 1. ✅ Valid inputs (should work)
 * 2. ❌ Invalid inputs (should fail with helpful errors)
 * 3. 🔒 Security checks (users can't access other users' goals)
 */

const request = require("supertest");
const app = require("../../app");
const Goal = require("../../models/goalModel");
const User = require("../../models/userModel");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

// Test database setup
let testDatabase;

// This runs once before ALL tests
beforeAll(async () => {
  // Create temporary test database
  testDatabase = await MongoMemoryServer.create();
  const databaseUrl = testDatabase.getUri();
  await mongoose.connect(databaseUrl);
  process.env.JWT_SECRET = "test-secret-key";
});

// This runs once after ALL tests
afterAll(async () => {
  await mongoose.disconnect();
  await testDatabase.stop();
});

// Main test suite
describe("Goal Controller - Complete API Tests", () => {
  // Variables we'll use across tests
  let user1Token, user2Token;  // Auth tokens for two test users
  let user1Id, user2Id;        // User IDs
  let testGoal;                // A test goal we'll create

  // Before EACH test, set up fresh data
  beforeEach(async () => {
    // Clear the database
    await Goal.deleteMany({});
    await User.deleteMany({});

    // Create two test users
    const user1 = await User.create({
      name: "Test User 1",
      email: "user1@test.com",
      password: "hashed-password-1"
    });
    
    const user2 = await User.create({
      name: "Test User 2", 
      email: "user2@test.com",
      password: "hashed-password-2"
    });

    // Save their IDs
    user1Id = user1._id;
    user2Id = user2._id;

    // Create auth tokens (like login tickets)
    user1Token = jwt.sign({ id: user1Id }, process.env.JWT_SECRET);
    user2Token = jwt.sign({ id: user2Id }, process.env.JWT_SECRET);

    // Create a test goal for user1
    testGoal = await Goal.create({
      text: "Test Goal",
      user: user1Id,
      completed: false
    });
  });

  /**
   * TEST GROUP 1: Creating Goals (POST /api/goals)
   * These tests check if users can create new goals correctly
   */
  describe("POST /api/goals - Creating New Goals", () => {
    
    test("✅ Should create a new goal with just text", async () => {
      const newGoalData = {
        text: "Learn JavaScript testing"
      };

      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`) // Who's making the request
        .send(newGoalData)                            // What data to send
        .expect(201);                                 // 201 = Created successfully

      // Check the response
      expect(response.body.text).toBe("Learn JavaScript testing");
      expect(response.body.completed).toBe(false);  // Should default to false
      expect(response.body.user).toBe(user1Id.toString());
      expect(response.body).toHaveProperty("_id"); // Should have an ID
    });

    test("✅ Should create a completed goal if specified", async () => {
      const completedGoalData = {
        text: "Already finished task",
        completed: true  // Explicitly set as completed
      };

      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(completedGoalData)
        .expect(201);

      expect(response.body.text).toBe("Already finished task");
      expect(response.body.completed).toBe(true);
    });

    test("❌ Should fail without goal text", async () => {
      const emptyGoal = {}; // No text!

      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(emptyGoal)
        .expect(400); // 400 = Bad Request

      expect(response.body.message).toContain("Please add a text field");
    });

    test("❌ Should fail with empty text after trimming spaces", async () => {
      const spacesOnlyGoal = {
        text: "   "  // Just spaces, no real content
      };

      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(spacesOnlyGoal)
        .expect(400);

      expect(response.body.message).toContain("Please add a text field");
    });

    test("✅ Should trim whitespace from goal text", async () => {
      const goalWithSpaces = {
        text: "  Trimmed Goal  "  // Has spaces before and after
      };

      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(goalWithSpaces)
        .expect(201);

      expect(response.body.text).toBe("Trimmed Goal"); // Spaces removed!
    });

    test("🔒 Should require authentication", async () => {
      const newGoal = { text: "Unauthorized attempt" };

      const response = await request(app)
        .post("/api/goals")
        // No Authorization header!
        .send(newGoal)
        .expect(401); // 401 = Unauthorized

      expect(response.body.message).toContain("Not authorized");
    });
  });

  /**
   * TEST GROUP 2: Getting Goals (GET /api/goals)
   * These tests check if users can retrieve their goals
   */
  describe("GET /api/goals - Retrieving User Goals", () => {
    
    beforeEach(async () => {
      // Add more goals for testing
      await Goal.create([
        { text: "User1 Goal 1", user: user1Id, completed: true },
        { text: "User1 Goal 2", user: user1Id, completed: false },
        { text: "User2 Goal 1", user: user2Id, completed: false }
      ]);
    });

    test("✅ Should return only the user's own goals", async () => {
      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      // User1 should have 3 goals total (1 from main beforeEach + 2 from this beforeEach)
      expect(response.body.length).toBe(3);
      
      // All goals should belong to user1
      response.body.forEach(goal => {
        expect(goal.user).toBe(user1Id.toString());
      });

      // Check specific goals exist
      const goalTexts = response.body.map(g => g.text);
      expect(goalTexts).toContain("Test Goal");
      expect(goalTexts).toContain("User1 Goal 1");
      expect(goalTexts).toContain("User1 Goal 2");
      expect(goalTexts).not.toContain("User2 Goal 1"); // Should NOT see user2's goal
    });

    test("✅ Should return goals with all fields", async () => {
      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      // Check first goal has all expected fields
      const firstGoal = response.body[0];
      expect(firstGoal).toHaveProperty("_id");
      expect(firstGoal).toHaveProperty("text");
      expect(firstGoal).toHaveProperty("completed");
      expect(firstGoal).toHaveProperty("user");
      expect(firstGoal).toHaveProperty("createdAt");
      expect(firstGoal).toHaveProperty("updatedAt");
    });

    test("✅ Should return empty array if user has no goals", async () => {
      // Create a new user with no goals
      const newUser = await User.create({
        name: "New User",
        email: "newuser@test.com",
        password: "hashed-password"
      });
      const newUserToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body).toEqual([]); // Empty array
      expect(response.body.length).toBe(0);
    });

    test("🔒 Should require authentication", async () => {
      const response = await request(app)
        .get("/api/goals")
        // No Authorization header!
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  /**
   * TEST GROUP 3: Updating Goals (PUT /api/goals/:id)
   * These tests check if users can update their goals
   */
  describe("PUT /api/goals/:id - Updating Goals", () => {
    
    test("✅ Should update goal text only", async () => {
      const updateData = {
        text: "Updated Goal Text"
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.text).toBe("Updated Goal Text");
      expect(response.body.completed).toBe(false); // Should stay unchanged
    });

    test("✅ Should update completion status only", async () => {
      const updateData = {
        completed: true
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.completed).toBe(true);
      expect(response.body.text).toBe("Test Goal"); // Should stay unchanged
    });

    test("✅ Should update both text and completion", async () => {
      const updateData = {
        text: "Completely Updated Goal",
        completed: true
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.text).toBe("Completely Updated Goal");
      expect(response.body.completed).toBe(true);
    });

    test("❌ Should fail with no update fields", async () => {
      const emptyUpdate = {}; // No fields to update!

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send(emptyUpdate)
        .expect(400);

      expect(response.body.message).toContain("Please provide at least one field to update");
    });

    test("❌ Should fail with invalid goal ID format", async () => {
      const updateData = { text: "Won't work" };

      const response = await request(app)
        .put("/api/goals/not-a-valid-id")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain("Invalid goal id");
    });

    test("❌ Should fail if goal doesn't exist", async () => {
      const fakeGoalId = new mongoose.Types.ObjectId();
      const updateData = { text: "Won't work" };

      const response = await request(app)
        .put(`/api/goals/${fakeGoalId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain("Goal not found");
    });

    test("🔒 Should not allow updating another user's goal", async () => {
      const updateData = { text: "Trying to hack!" };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user2Token}`) // User2 trying to update User1's goal!
        .send(updateData)
        .expect(403); // 403 = Forbidden

      expect(response.body.message).toContain("Not authorized to update this goal");

      // Verify goal wasn't changed
      const unchangedGoal = await Goal.findById(testGoal._id);
      expect(unchangedGoal.text).toBe("Test Goal"); // Original text
    });
  });

  /**
   * TEST GROUP 4: Deleting Goals (DELETE /api/goals/:id)
   * These tests check if users can delete their goals
   */
  describe("DELETE /api/goals/:id - Deleting Goals", () => {
    
    test("✅ Should delete own goal successfully", async () => {
      const response = await request(app)
        .delete(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.message).toBe("Goal successfully deleted.");
      expect(response.body.goal._id).toBe(testGoal._id.toString());

      // Verify goal is actually deleted from database
      const deletedGoal = await Goal.findById(testGoal._id);
      expect(deletedGoal).toBeNull();
    });

    test("❌ Should fail with invalid goal ID format", async () => {
      const response = await request(app)
        .delete("/api/goals/invalid-id-format")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.message).toContain("Invalid goal id");
    });

    test("❌ Should fail if goal doesn't exist", async () => {
      const fakeGoalId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/goals/${fakeGoalId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.message).toContain("Goal not found");
    });

    test("🔒 Should not allow deleting another user's goal", async () => {
      const response = await request(app)
        .delete(`/api/goals/${testGoal._id}`)
        .set("Authorization", `Bearer ${user2Token}`) // User2 trying to delete User1's goal!
        .expect(403);

      expect(response.body.message).toContain("Not authorized to delete this goal");

      // Verify goal still exists
      const stillExists = await Goal.findById(testGoal._id);
      expect(stillExists).toBeTruthy();
    });

    test("🔒 Should require authentication", async () => {
      const response = await request(app)
        .delete(`/api/goals/${testGoal._id}`)
        // No Authorization header!
        .expect(401);

      expect(response.body.message).toContain("Not authorized");
    });
  });

  /**
   * TEST GROUP 5: Advanced Scenarios
   * These tests check edge cases and special situations
   */
  describe("Advanced Test Scenarios", () => {
    
    test("📊 Should handle creating multiple goals at once", async () => {
      // Simulate rapid goal creation (like a user clicking fast)
      const goalPromises = [];
      
      for (let i = 1; i <= 5; i++) {
        goalPromises.push(
          request(app)
            .post("/api/goals")
            .set("Authorization", `Bearer ${user1Token}`)
            .send({ text: `Quick Goal ${i}` })
        );
      }

      // Wait for all requests to complete
      const responses = await Promise.all(goalPromises);
      
      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.text).toBe(`Quick Goal ${index + 1}`);
      });

      // Verify all 5 were created (plus the 1 from beforeEach)
      const allGoals = await Goal.find({ user: user1Id });
      expect(allGoals.length).toBe(6);
    });

    test("🔍 Should handle database errors gracefully", async () => {
      // Simulate a database error
      jest.spyOn(Goal, "find").mockRejectedValueOnce(new Error("Database is down!"));

      const response = await request(app)
        .get("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(500); // 500 = Internal Server Error

      expect(response.body.message).toBeTruthy();
      
      // Clean up the mock
      Goal.find.mockRestore();
    });

    test("📝 Should validate goal text length", async () => {
      // Create a very long text (over 1000 characters)
      const veryLongText = "a".repeat(1001);
      
      const response = await request(app)
        .post("/api/goals")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ text: veryLongText })
        .expect(400);

      expect(response.body.message).toBeTruthy();
    });
  });
});

/**
 * Summary for Junior Developers:
 * 
 * This test file covers all the ways users interact with goals:
 * 1. Creating goals (POST)
 * 2. Reading/Getting goals (GET)  
 * 3. Updating goals (PUT)
 * 4. Deleting goals (DELETE)
 * 
 * Each operation is tested for:
 * - ✅ Success cases (valid inputs)
 * - ❌ Failure cases (invalid inputs)
 * - 🔒 Security (users can only access their own goals)
 * 
 * Key Testing Patterns:
 * - Use descriptive test names that explain what's being tested
 * - Test both success and failure scenarios
 * - Always test authentication/authorization
 * - Clean up data between tests (using beforeEach)
 * - Use meaningful assertions (expect statements)
 * 
 * Running These Tests:
 * - npm test goalController.test.js (run just this file)
 * - npm test (run all tests)
 * - npm test -- --coverage (see test coverage)
 */